import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Popconfirm, Progress, Select, Space, Table, Tag } from "antd";
import { ArrowRightOutlined, StopOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { RunEvent, RunRepetition } from "../api/generated/model";
import type { CaseResult } from "../types";
import { displayValue, failureTypeName, riskName, statusName, trackName, verdictName } from "../utils/format";

const terminalStates = new Set([
  "completed",
  "completed_with_substitutions",
  "failed",
  "cancelled",
]);

export function RunDetailPage() {
  const { runId = "R-20260815-004" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const queryClient = useQueryClient();
  const [selectedRepetitionId, setSelectedRepetitionId] = useState<string>();

  const authority = useQuery({
    queryKey: ["run-authority", runId],
    queryFn: () => consoleApi.getBenchmarkRunAuthorityStatus(runId),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      return status !== undefined && terminalStates.has(status) ? false : 1_500;
    },
  });
  const dashboard = useQuery({
    queryKey: ["run", runId],
    queryFn: () => consoleApi.getRun(runId),
    retry: false,
    refetchInterval: (query) => query.state.data && authority.data && terminalStates.has(authority.data.data.status) ? false : 2_500,
  });
  const qualification = useQuery({
    queryKey: ["diagnostic-qualification", runId],
    queryFn: () => consoleApi.getDiagnosticRunQualification(runId),
    retry: false,
    refetchInterval: authority.data && !terminalStates.has(authority.data.data.status) ? 3_000 : false,
  });
  const runRepetitions = useQuery({
    queryKey: ["run-repetitions", runId],
    queryFn: () => consoleApi.listBenchmarkRunRepetitions(runId),
    retry: false,
    refetchInterval: (query) => query.state.data && authority.data && terminalStates.has(authority.data.data.status) ? false : 2_500,
  });
  const runEvents = useQuery({
    queryKey: ["run-events", runId],
    queryFn: () => consoleApi.listBenchmarkRunEvents(runId),
    retry: false,
    refetchInterval: (query) => query.state.data && authority.data && terminalStates.has(authority.data.data.status) ? false : 2_500,
  });
  const capabilities = useQuery({
    queryKey: ["diagnostic-capabilities", runId],
    queryFn: () => consoleApi.listDiagnosticExternalCapabilities(runId),
    retry: false,
    refetchInterval: authority.data && !terminalStates.has(authority.data.data.status) ? 3_000 : false,
  });

  const repetitions = useMemo(
    () => extractRepetitions(runRepetitions.data?.data ?? dashboard.data?.data.repetitions),
    [dashboard.data?.data.repetitions, runRepetitions.data?.data],
  );
  const repetitionId = selectedRepetitionId ?? repetitions[0]?.repetitionId;
  const diagnosticOptions = {
    enabled: repetitionId !== undefined,
    retry: false,
    refetchInterval: authority.data && !terminalStates.has(authority.data.data.status) ? 3_000 : false,
  } as const;
  const repetition = useQuery({
    queryKey: ["diagnostic-repetition", runId, repetitionId],
    queryFn: () => consoleApi.getDiagnosticRepetition(runId, repetitionId!),
    ...diagnosticOptions,
  });
  const artifacts = useQuery({
    queryKey: ["diagnostic-artifacts", runId, repetitionId],
    queryFn: () => consoleApi.listDiagnosticRepetitionArtifacts(runId, repetitionId!),
    ...diagnosticOptions,
  });
  const executionTrace = useQuery({
    queryKey: ["diagnostic-execution-trace", runId, repetitionId],
    queryFn: () => consoleApi.getDiagnosticExecutionTrace(runId, repetitionId!),
    ...diagnosticOptions,
  });
  const physicalVerification = useQuery({
    queryKey: ["diagnostic-physical-verification", runId, repetitionId],
    queryFn: () => consoleApi.getDiagnosticPhysicalVerification(runId, repetitionId!),
    ...diagnosticOptions,
  });
  const faultAttribution = useQuery({
    queryKey: ["diagnostic-fault-attribution", runId, repetitionId],
    queryFn: () => consoleApi.getDiagnosticFaultAttribution(runId, repetitionId!),
    ...diagnosticOptions,
  });
  const cancel = useMutation({
    mutationFn: () => consoleApi.cancelBenchmarkRun(runId, "cancelled from SDAR Benchmark Console"),
    onSuccess: async (resource) => {
      queryClient.setQueryData(["run-authority", runId], resource);
      await queryClient.invalidateQueries({ queryKey: ["run-authority", runId] });
      await queryClient.invalidateQueries({ queryKey: ["run", runId] });
    },
  });

  const status = authority.data?.data;
  const run = dashboard.data?.data.run;
  const isTerminal = status ? terminalStates.has(status.status) : false;
  const cancellationPhase = status?.status === "cancelled"
    ? "cancelled"
    : status?.cancellationRequested
      ? "cancellation requested · cleanup running"
      : "not requested";

  if (!authority.data && authority.isLoading) {
    return <div className="standard-page"><SectionCard><div className="page-loading">正在读取 PostgreSQL Run Authority…</div></SectionCard></div>;
  }

  return (
    <div className="standard-page run-detail-page">
      <PageHeader
        title={`Benchmark Run ${runId}`}
        subtitle="权威状态与投影状态分层展示；Development 结果永不冒充正式资格结论。"
        meta={authority.data?.meta ?? dashboard.data?.meta}
        actions={(
          <Space>
            <Button onClick={() => queryClient.invalidateQueries({ predicate: (query) => query.queryKey.includes(runId) })}>刷新</Button>
            <Popconfirm
              title="请求取消该 Run？"
              description="取消是异步操作；页面会继续轮询到 worker 清理完成后的终态。"
              okText="请求取消"
              cancelText="返回"
              onConfirm={() => cancel.mutate()}
            >
              <Button danger icon={<StopOutlined />} disabled={isTerminal || status?.cancellationRequested} loading={cancel.isPending}>取消 Run</Button>
            </Popconfirm>
          </Space>
        )}
      />

      {authority.isError && <Alert type="error" showIcon message="Run Authority 不可用" description="HTTP 模式不会回退 Mock；请检查 Benchmark Server 后重试。" />}
      {cancel.isError && <Alert type="error" showIcon message="取消请求失败" description={errorMessage(cancel.error)} />}

      <SectionCard title="Development 执行边界">
        <Space wrap size={[8, 8]}>
          <Tag color="blue">DEVELOPMENT</Tag>
          <Tag color="red">NOT FORMAL QUALIFICATION</Tag>
          <Tag>QUALITY SCORE —</Tag>
          <Tag>RELEASE GATE UNAVAILABLE</Tag>
          {status?.status === "completed_with_substitutions" && <Tag color="gold">COMPLETED WITH SUBSTITUTIONS</Tag>}
        </Space>
        <div className="diagnostic-boundary-grid">
          <Descriptions column={1} size="small" title="Run Authority" items={[
            { key: "status", label: "PostgreSQL 状态", children: <Tag color={authorityColor(status?.status)}>{status?.status ?? "unavailable"}</Tag> },
            { key: "cancel", label: "取消阶段", children: cancellationPhase },
            { key: "progress", label: "Case 进度", children: status ? `${status.completedCaseCount}/${status.totalCaseCount}` : "—" },
            { key: "failure", label: "失败分类", children: status?.failureClass ?? "—" },
            { key: "updated", label: "更新时间", children: status?.updatedAt ?? "—" },
          ]} />
          <Descriptions column={1} size="small" title="Worker / Evidence / Evaluation" items={[
            { key: "worker", label: "Worker 执行", children: workerPhase(status?.status) },
            { key: "evidence", label: "Evidence Projection", children: dashboard.isError ? "partial / unavailable" : dashboard.data ? "available" : "pending" },
            { key: "qualification", label: "Evaluation", children: qualification.data ? qualification.data.data.formalizationStatus : qualification.isError ? "unavailable" : "pending" },
            { key: "formal", label: "Formal Eligible", children: <Tag color="red">FALSE</Tag> },
            { key: "gate", label: "Release Gate", children: qualification.data?.data.releaseGate ?? "unavailable" },
          ]} />
        </div>
        {status && <Progress percent={status.totalCaseCount === 0 ? 0 : Math.round((status.completedCaseCount / status.totalCaseCount) * 100)} status={status.status === "failed" ? "exception" : undefined} />}
      </SectionCard>

      <SectionCard title="UGV 诊断：Agent / SMPP Provider / Physical" extra={capabilities.data && <ApiStatusTag compact meta={capabilities.data.meta} />}>
        {repetitions.length > 0 ? (
          <Select
            value={repetitionId}
            onChange={setSelectedRepetitionId}
            style={{ minWidth: 360, marginBottom: 10 }}
            options={repetitions.map((item) => ({ value: item.repetitionId, label: `${item.caseId ?? "case"} · ${item.repetitionId}` }))}
          />
        ) : <Alert type="info" showIcon message="Repetition 尚未投影" description="Run Authority 仍可独立观察；生成 repetition 后会显示七项诊断资源。" />}
        <div className="diagnostic-layer-grid">
          <DiagnosticLayer
            title="Agent 层"
            values={[repetition.data?.data, executionTrace.data?.data]}
            unavailable={repetition.isError || executionTrace.isError}
          />
          <DiagnosticLayer
            title="SMPP Provider 层"
            values={[capabilities.data?.data, artifacts.data?.data]}
            unavailable={capabilities.isError || artifacts.isError}
          />
          <DiagnosticLayer
            title="Physical 层"
            values={[physicalVerification.data?.data, faultAttribution.data?.data]}
            unavailable={physicalVerification.isError || faultAttribution.isError}
          />
        </div>
      </SectionCard>

      {dashboard.data && (
        <DashboardProjection
          data={dashboard.data.data}
          events={runEvents.data?.data}
          navigateWithContext={navigateWithContext}
        />
      )}
      {dashboard.isError && (
        <SectionCard title="Evidence Projection">
          <Alert type="warning" showIcon message="Dashboard 投影暂不可用" description="这不会覆盖或改变 PostgreSQL Run Authority 状态。" />
        </SectionCard>
      )}
    </div>
  );
}

function DashboardProjection({
  data,
  events,
  navigateWithContext,
}: {
  data: Awaited<ReturnType<typeof consoleApi.getRun>>["data"];
  events?: RunEvent[];
  navigateWithContext: (path: string) => void;
}) {
  const caseMeta = capabilityMeta("runCases", {
    mocked: true,
    watermark: data.snapshot.watermark,
    projectionLagMs: data.snapshot.projectionLagMs,
  });
  const columns = [
    { title: "用例编号", dataIndex: "caseId", key: "caseId", render: (value: string, row: CaseResult) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{value}</button> },
    { title: "分轨", dataIndex: "track", key: "track", render: (value: string) => trackName(value) },
    { title: "风险", dataIndex: "risk", key: "risk", render: (value: string) => <Tag color={value === "critical" ? "red" : value === "high" ? "orange" : "blue"}>{riskName(value)}</Tag> },
    { title: "重复次数", dataIndex: "repetitions", key: "repetitions" },
    { title: "结论", dataIndex: "verdict", key: "verdict", render: (value: string) => <Tag>{verdictName(value)}</Tag> },
    { title: "平均得分", dataIndex: "score", key: "score", render: (value: number | null) => displayValue(value) },
    { title: "失败类型", dataIndex: "failureType", key: "failureType", render: (value: string) => failureTypeName(value) },
    { title: "评价结果", key: "evaluation", render: (_: unknown, row: CaseResult) => <Button type="link" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>打开 <ArrowRightOutlined /></Button> },
  ];
  return (
    <div className="detail-grid">
      <SectionCard title="真实 Run Events" className="detail-span-6"><pre>{JSON.stringify(events ?? data.events, null, 2)}</pre></SectionCard>
      <SectionCard title="Evidence Funnel / Release Gate 投影" className="detail-span-6"><pre>{JSON.stringify({ evidenceFunnel: data.evidenceFunnel, releaseGate: data.releaseGateDetail }, null, 2)}</pre></SectionCard>
      <SectionCard title="用例矩阵" extra={<ApiStatusTag compact meta={caseMeta} />} className="detail-span-12 table-card">
        <Table<CaseResult> rowKey="caseId" columns={columns} dataSource={data.cases} pagination={false} scroll={{ x: 980 }} />
      </SectionCard>
    </div>
  );
}

function DiagnosticLayer({ title, values, unavailable }: { title: string; values: unknown[]; unavailable: boolean }) {
  const available = values.filter((value) => value !== undefined);
  return (
    <article className="diagnostic-layer">
      <h3>{title}</h3>
      {available.length > 0 ? <pre>{JSON.stringify(available, null, 2)}</pre> : <span className="diagnostic-muted">{unavailable ? "unavailable / artifact not present" : "pending"}</span>}
    </article>
  );
}

function extractRepetitions(input: unknown[] | undefined): Array<Pick<RunRepetition, "repetitionId" | "caseId">> {
  if (!input) return [];
  return input.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    return typeof item.repetitionId === "string"
      ? [{ repetitionId: item.repetitionId, caseId: typeof item.caseId === "string" ? item.caseId : null }]
      : [];
  });
}

function authorityColor(status: string | undefined) {
  if (status === "completed" || status === "completed_with_substitutions") return "green";
  if (status === "failed" || status === "cancelled") return "red";
  return "blue";
}

function workerPhase(status: string | undefined) {
  if (!status) return "unavailable";
  if (status === "queued" || status === "created") return "awaiting standard worker lease";
  if (status === "cancelling") return "cleanup running";
  if (terminalStates.has(status)) return `terminal · ${status}`;
  return `executing · ${status}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
