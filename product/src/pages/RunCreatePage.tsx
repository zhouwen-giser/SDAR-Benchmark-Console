import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Descriptions,
  Space,
  Steps,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { RunCatalogConfigurator, type RunCatalogSelection, type RunPresetCatalogOption } from "../components/RunCatalogConfigurator";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type {
  CreateBenchmarkRun,
  DevelopmentExecutionPolicy,
  DevelopmentRunPreflight,
} from "../api/generated/model";

export function RunCreatePage() {
  const { navigateWithContext } = useAnalysisContext();
  const [selection, setSelection] = useState<RunCatalogSelection | null>(null);
  const [preflight, setPreflight] = useState<DevelopmentRunPreflight | null>(null);
  const idempotencyKey = useRef(`console-ugv-development-${crypto.randomUUID()}`);
  const compatibilityPreset = useQuery({
    queryKey: ["ugv-development-preset"],
    queryFn: () => consoleApi.getUgvDiagnosticDevelopmentPreset(),
  });
  const catalog = useQuery({
    queryKey: ["benchmark-run-presets"],
    queryFn: () => consoleApi.listBenchmarkRunPresets(),
  });
  const catalogPresets = useMemo(() => (catalog.data?.data ?? []).map(toCatalogPreset).filter((item): item is RunPresetCatalogOption => item !== null), [catalog.data]);
  useEffect(() => {
    if (selection !== null || catalogPresets.length === 0) return;
    const preset = catalogPresets.find((item) => item.id === "ugv-diagnostic-regression/0.2") ?? catalogPresets[0]!;
    setSelection({ presetId: preset.id, datasetVersionRef: preset.datasetVersionRef, candidateSnapshotRef: preset.candidateSnapshotRef, target: "simulated", selectedCaseIds: [...preset.selectedCaseIds], repeatCount: preset.repeatCount });
  }, [catalogPresets, selection]);
  const request = useMemo(() => {
    const template = compatibilityPreset.data?.data.requestTemplate;
    return template === null || template === undefined || selection === null
      ? null
      : developmentRequest(template, selection, idempotencyKey.current);
  }, [compatibilityPreset.data, selection]);

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

  const unavailable = compatibilityPreset.data?.data.availability !== "available" || catalogPresets.length === 0 || request === null;
  const canCreate = preflight?.canCreateRun === true && preflight.canExecuteRun === true;
  const currentStep = createMutation.isSuccess ? 3 : createMutation.isPending ? 2 : preflight === null ? 0 : 1;

  return (
    <div className="standard-page run-create-page">
      <PageHeader
        title="新建 Benchmark Run"
        subtitle="从 Server 可发现的 UGV preset 预检、确认替代计划，再写入 PostgreSQL Run Authority。"
        meta={catalog.data?.meta ?? compatibilityPreset.data?.meta}
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

      {(catalog.isError || compatibilityPreset.isError) && (
        <Alert
          type="error"
          showIcon
          message="无法读取 Benchmark Catalog / Development execution template"
          description="HTTP 模式不会回退到 Mock。请恢复 Benchmark Server 后重试。"
          action={<Button onClick={() => { void catalog.refetch(); void compatibilityPreset.refetch(); }}>重试</Button>}
        />
      )}
      {compatibilityPreset.data && unavailable && (
        <Alert
          type="warning"
          showIcon
          message="Server 尚未配置可执行 preset"
          description={compatibilityPreset.data.data.reasonCodes.join("、") || "DEV_PRESET_NOT_CONFIGURED"}
        />
      )}

      <div className="run-create-grid">
        <SectionCard title="Server-driven Benchmark Catalog" className="run-create-main-card">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {selection && <RunCatalogConfigurator
              presets={catalogPresets}
              datasets={uniqueCatalogOptions(catalogPresets, "datasetVersionRef")}
              candidates={uniqueCatalogOptions(catalogPresets, "candidateSnapshotRef")}
              cases={catalogCaseOptions(catalogPresets, selection.datasetVersionRef)}
              value={selection}
              onChange={(value) => { setSelection(value); setPreflight(null); }}
            />}
            <Alert
              type="info"
              showIcon
              message="开发模式不以 exact commit 作为执行门禁"
              description="分支、Commit 与 Dirty 状态仍作为 provenance 保存；所有结果均为 NOT FORMAL QUALIFICATION。"
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
                创建 Benchmark Run
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
              { key: "preset", label: "Preset", children: selection?.presetId ?? "—" },
              { key: "dataset", label: "Dataset", children: selection?.datasetVersionRef ?? "—" },
              { key: "candidate", label: "Candidate", children: selection?.candidateSnapshotRef ?? "—" },
              { key: "cases", label: "Cases × Repeat", children: selection ? `${selection.selectedCaseIds.length} × ${selection.repeatCount}` : "—" },
              { key: "target", label: "Target", children: selection?.target ?? "—" },
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
  selection: RunCatalogSelection,
  idempotencyKey: string,
): CreateBenchmarkRun {
  const request = structuredClone(template);
  const policy = request.executionPolicy as DevelopmentExecutionPolicy;
  if (policy.runClass !== "development") throw new Error("UGV preset 不是 Development execution policy。");
  request.datasetVersionRef = selection.datasetVersionRef;
  request.candidate.snapshotRef = selection.candidateSnapshotRef;
  policy.target = selection.target;
  policy.permit.target = selection.target;
  policy.allowDevelopmentSubstitutions = true;
  policy.fallbackToSimulation = true;
  Object.assign(policy, { selectedCaseIds: selection.selectedCaseIds, repeatCount: selection.repeatCount });
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

function toCatalogPreset(value: Awaited<ReturnType<typeof consoleApi.listBenchmarkRunPresets>>["data"][number]): RunPresetCatalogOption | null {
  const preset = value.preset as Record<string, unknown>;
  const datasetVersionRef = stringValue(preset.datasetVersionRef);
  const candidateSnapshotRef = stringValue(preset.candidateSnapshotRef);
  const selectedCaseIds = Array.isArray(preset.selectedCaseIds) ? preset.selectedCaseIds.filter((item): item is string => typeof item === "string") : [];
  const repeatCount = typeof preset.repeatCount === "number" && Number.isSafeInteger(preset.repeatCount) ? preset.repeatCount : 1;
  if (!datasetVersionRef || !candidateSnapshotRef || selectedCaseIds.length === 0) return null;
  const candidateSnapshotRefs = Array.isArray(preset.candidateSnapshotRefs)
    ? preset.candidateSnapshotRefs.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  return { id: value.presetVersionId, label: `${value.label} · ${value.version}`, availability: value.status === "active" ? "available" : "unavailable", datasetVersionRef, candidateSnapshotRef, candidateSnapshotRefs: [...new Set([candidateSnapshotRef, ...candidateSnapshotRefs])], selectedCaseIds, repeatCount, dataClass: stringValue(preset.dataClass) ?? "unavailable" };
}

function uniqueCatalogOptions(presets: RunPresetCatalogOption[], field: "datasetVersionRef" | "candidateSnapshotRef") {
  const values = field === "candidateSnapshotRef"
    ? presets.flatMap((item) => item.candidateSnapshotRefs)
    : presets.map((item) => item.datasetVersionRef);
  return [...new Set(values)].map((id) => ({ id, label: id, availability: "available" as const }));
}

function catalogCaseOptions(presets: RunPresetCatalogOption[], datasetVersionRef: string) {
  const caseIds = [...new Set(presets.filter((item) => item.datasetVersionRef === datasetVersionRef).flatMap((item) => item.selectedCaseIds))];
  return caseIds.map((caseId) => ({ caseId, label: caseId, track: caseId.split("-")[1] ?? "unknown" }));
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
