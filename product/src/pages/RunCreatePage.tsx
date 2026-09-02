import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Descriptions,
  Radio,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type {
  CreateBenchmarkRun,
  DevelopmentExecutionPolicy,
  DevelopmentRunPreflight,
} from "../api/generated/model";

const cases = [
  { caseId: "UGV-NODE-001", scenario: "陈旧状态安全拒绝", expected: "零导航、零远端任务、终态" },
  { caseId: "UGV-CORE-001", scenario: "点位导航与物理验证", expected: "一次逻辑导航、轨迹、物理验证" },
  { caseId: "UGV-MCP-003", scenario: "持久派发后响应丢失", expected: "一次任务/任务单、对账、不盲重发" },
  { caseId: "UGV-XCHAIN-003", scenario: "控制成功但物理无效", expected: "跨链矛盾归因、必须终态" },
] as const;

type DevelopmentTarget = "simulated" | "live";

export function RunCreatePage() {
  const { navigateWithContext } = useAnalysisContext();
  const [target, setTarget] = useState<DevelopmentTarget>("simulated");
  const [preflight, setPreflight] = useState<DevelopmentRunPreflight | null>(null);
  const idempotencyKey = useRef(`console-ugv-development-${crypto.randomUUID()}`);
  const preset = useQuery({
    queryKey: ["ugv-development-preset"],
    queryFn: () => consoleApi.getUgvDiagnosticDevelopmentPreset(),
  });
  const request = useMemo(() => {
    const template = preset.data?.data.requestTemplate;
    return template === null || template === undefined
      ? null
      : developmentRequest(template, target, idempotencyKey.current);
  }, [preset.data, target]);

  const preflightMutation = useMutation({
    mutationFn: async () => {
      if (request === null) throw new Error("Server 未提供可执行的 UGV Development preset。");
      return consoleApi.preflightBenchmarkRun(request);
    },
    onSuccess: (resource) => setPreflight(resource.data),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (request === null || preflight === null) throw new Error("必须先完成预检。");
      return consoleApi.createBenchmarkRun(withPreflight(request, preflight));
    },
    onSuccess: (resource) => navigateWithContext(`/runs/${resource.data.runId}`),
  });

  const unavailable = preset.data?.data.availability !== "available" || request === null;
  const canCreate = preflight?.canCreateRun === true && preflight.canExecuteRun === true;
  const currentStep = createMutation.isSuccess ? 3 : createMutation.isPending ? 2 : preflight === null ? 0 : 1;

  return (
    <div className="standard-page run-create-page">
      <PageHeader
        title="新建 Benchmark Run"
        subtitle="从 Server 可发现的 UGV preset 预检、确认替代计划，再写入 PostgreSQL Run Authority。"
        meta={preset.data?.meta}
        actions={<Button onClick={() => navigateWithContext("/runs")}>返回运行列表</Button>}
      />

      <Steps
        className="run-create-steps"
        current={currentStep}
        items={[
          { title: "选择模式", icon: <ExperimentOutlined /> },
          { title: "预检计划", icon: <SafetyCertificateOutlined /> },
          { title: "创建运行", icon: <PlayCircleOutlined /> },
          { title: "进入监控", icon: <CheckCircleOutlined /> },
        ]}
      />

      {preset.isError && (
        <Alert
          type="error"
          showIcon
          message="无法读取 UGV Development preset"
          description="HTTP 模式不会回退到 Mock。请恢复 Benchmark Server 后重试。"
          action={<Button onClick={() => preset.refetch()}>重试</Button>}
        />
      )}
      {preset.data && unavailable && (
        <Alert
          type="warning"
          showIcon
          message="Server 尚未配置可执行 preset"
          description={preset.data.data.reasonCodes.join("、") || "DEV_PRESET_NOT_CONFIGURED"}
        />
      )}

      <div className="run-create-grid">
        <SectionCard title="UGV 四项开发诊断" className="run-create-main-card">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Typography.Text type="secondary">执行模式</Typography.Text>
              <Radio.Group
                className="run-mode-selector"
                value={target}
                onChange={(event) => {
                  setTarget(event.target.value as DevelopmentTarget);
                  setPreflight(null);
                }}
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: "simulated", label: "Development · Simulated（默认）" },
                  { value: "live", label: "Development · Live" },
                ]}
              />
            </div>
            <Alert
              type="info"
              showIcon
              message="开发模式不以 exact commit 作为执行门禁"
              description="分支、Commit 与 Dirty 状态仍作为 provenance 保存；所有结果均为 NOT FORMAL QUALIFICATION。"
            />
            <Table
              rowKey="caseId"
              size="small"
              pagination={false}
              dataSource={[...cases]}
              columns={[
                { title: "Case", dataIndex: "caseId", width: 155, render: (value: string) => <Tag color="blue">{value}</Tag> },
                { title: "场景", dataIndex: "scenario", width: 220 },
                { title: "开发闭环要求", dataIndex: "expected" },
              ]}
            />
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<SafetyCertificateOutlined />}
                disabled={unavailable}
                loading={preflightMutation.isPending}
                onClick={() => preflightMutation.mutate()}
              >
                执行预检
              </Button>
              <Button
                size="large"
                icon={<PlayCircleOutlined />}
                disabled={!canCreate || createMutation.isPending}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                创建四 Case Run
              </Button>
            </Space>
            {preflightMutation.isError && <Alert type="error" showIcon message="预检请求失败" description={preflightMutation.error.message} />}
            {createMutation.isError && <Alert type="error" showIcon message="创建请求失败" description={createMutation.error.message} />}
          </Space>
        </SectionCard>

        <SectionCard title="执行边界" className="run-create-side-card">
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: "preset", label: "Preset", children: preset.data?.data.label ?? "—" },
              { key: "target", label: "Target", children: target },
              { key: "substitute", label: "Development substitutions", children: "允许且必须显式记录" },
              { key: "formal", label: "Formal Eligible", children: <Tag color="red">FALSE</Tag> },
              { key: "score", label: "Quality Score", children: "—" },
              { key: "gate", label: "Release Gate", children: "Unavailable" },
              { key: "authority", label: "Run Authority", children: "Benchmark PostgreSQL" },
              { key: "worker", label: "执行权威", children: "Standard benchmark-worker" },
            ]}
          />
        </SectionCard>
      </div>

      {preflight && (
        <SectionCard
          title="预检与替代计划"
          extra={<Tag color={preflight.status === "ready" ? "green" : preflight.status === "ready_with_substitutions" ? "gold" : "red"}>{preflight.status}</Tag>}
        >
          <div className="preflight-grid">
            <div>
              <h3>Checks</h3>
              {preflight.checks.map((item) => (
                <div className="preflight-row" key={item.checkId}>
                  <span>{item.checkId}</span>
                  <Tag color={item.status === "pass" ? "green" : item.status === "warning" ? "gold" : "red"}>{item.status}</Tag>
                  <small>{item.reasonCodes.join("、") || "—"}</small>
                </div>
              ))}
            </div>
            <div>
              <h3>Native / Proxy / Substitute</h3>
              {preflight.substitutions.map((item) => (
                <div className="preflight-row" key={item.substitutionId}>
                  <span>{item.capabilityId}</span>
                  <Tag color={item.implementationKind === "native" ? "green" : "purple"}>{item.implementationKind}</Tag>
                  <small>{item.implementationId}</small>
                </div>
              ))}
            </div>
          </div>
          {preflight.warnings.length > 0 && (
            <Alert className="preflight-warning" type="warning" showIcon message={preflight.warnings.join(" · ")} />
          )}
        </SectionCard>
      )}
    </div>
  );
}

function developmentRequest(
  template: CreateBenchmarkRun,
  target: DevelopmentTarget,
  idempotencyKey: string,
): CreateBenchmarkRun {
  const request = structuredClone(template);
  const policy = request.executionPolicy as DevelopmentExecutionPolicy;
  if (policy.runClass !== "development") throw new Error("UGV preset 不是 Development execution policy。");
  policy.target = target;
  policy.permit.target = target;
  policy.allowDevelopmentSubstitutions = true;
  policy.fallbackToSimulation = true;
  delete policy.developmentPreflight;
  request.idempotencyKey = idempotencyKey;
  return request;
}

function withPreflight(
  input: CreateBenchmarkRun,
  preflight: DevelopmentRunPreflight,
): CreateBenchmarkRun {
  const request = structuredClone(input);
  const policy = request.executionPolicy as DevelopmentExecutionPolicy;
  policy.developmentPreflight = preflight;
  return request;
}
