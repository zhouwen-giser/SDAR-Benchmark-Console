import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Popconfirm, Progress, Select, Space, Table, Tag } from "antd";
import { ArrowRightOutlined, StopOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, DebugPayloadDrawer, PageHeader, SectionCard } from "../components/common";
import { DataClassTag } from "../components/TypedAnalyticsModule";
import { RerunRequestPanel, type BenchmarkRunRerunRequestView } from "../components/RerunRequestPanel";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { DiagnosticArtifact, DiagnosticRepetition, RunEvent, RunTimelineEvent } from "../api/generated/model";
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
  const { navigateWithContext, searchParams } = useAnalysisContext();
  const parentRunId = searchParams.get("parentRunId");
  const childRunId = searchParams.get("childRunId");
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
  const diagnosticSummary = useQuery({ queryKey: ["product-diagnostic-summary", runId], queryFn: () => consoleApi.getBenchmarkRunDiagnosticSummary(runId), retry: false, refetchInterval: authority.data && !terminalStates.has(authority.data.data.status) ? 2_500 : false });
  const substitutions = useQuery({ queryKey: ["product-substitutions", runId], queryFn: () => consoleApi.getBenchmarkRunSubstitutions(runId), retry: false });
  const productTimeline = useQuery({ queryKey: ["product-timeline", runId], queryFn: () => consoleApi.getBenchmarkRunTimeline(runId), retry: false, refetchInterval: authority.data && !terminalStates.has(authority.data.data.status) ? 2_500 : false });
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
  const repetitionEvaluation = useQuery({ queryKey: ["product-repetition-evaluation", runId, repetitionId], queryFn: () => consoleApi.getBenchmarkRunRepetitionEvaluation(runId, repetitionId!), ...diagnosticOptions });
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
  const rerun = useMutation({
    mutationFn: (input: BenchmarkRunRerunRequestView) => consoleApi.createBenchmarkRunRerun(runId, input),
    onSuccess: (resource) => navigateWithContext(`/runs/${resource.data.runId}`, { parentRunId: resource.data.parentRunId, childRunId: undefined }),
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
      {rerun.isError && <Alert type="error" showIcon message="重跑请求失败" description={errorMessage(rerun.error)} />}

      {(parentRunId || childRunId) && <SectionCard title="Parent / Child Run lineage">
        <Descriptions bordered size="small" column={2} items={[
          { key: "parent", label: "Parent Run", children: parentRunId ? <Button type="link" onClick={() => navigateWithContext(`/runs/${parentRunId}`, { parentRunId: undefined, childRunId: runId })}>{parentRunId}</Button> : <code>{runId}</code> },
          { key: "child", label: "Child Run", children: childRunId ? <Button type="link" onClick={() => navigateWithContext(`/runs/${childRunId}`, { parentRunId: runId, childRunId: undefined })}>{childRunId}</Button> : <code>{runId}</code> },
        ]} />
        <Alert type="info" showIcon message="Rerun lineage is immutable" description="子 Run 使用新的 runId；父 Run 的请求、状态与结果不会被修改。" />
      </SectionCard>}

      {diagnosticSummary.data && <SectionCard title="Product Diagnostic Summary" extra={<ApiStatusTag compact meta={diagnosticSummary.data.meta} />}>
        <Descriptions bordered size="small" column={4} items={[
          { key: "status", label: "Status", children: <Tag color={authorityColor(diagnosticSummary.data.data.status)}>{diagnosticSummary.data.data.status}</Tag> },
          { key: "cases", label: "Cases", children: diagnosticSummary.data.data.caseCount },
          { key: "repetitions", label: "Terminal Repetitions", children: `${diagnosticSummary.data.data.terminalRepetitionCount}/${diagnosticSummary.data.data.repetitionCount}` },
          { key: "artifacts", label: "Artifacts", children: diagnosticSummary.data.data.artifactCount },
          { key: "substitutions", label: "Substitutions", children: diagnosticSummary.data.data.substitutionCount },
          { key: "formal", label: "Formal Eligible", children: <Tag color="red">{String(diagnosticSummary.data.data.formalEligible)}</Tag> },
          { key: "score", label: "Score", children: diagnosticSummary.data.data.score ?? "—" },
          { key: "release", label: "Release Gate", children: diagnosticSummary.data.data.releaseGate },
        ]} />
      </SectionCard>}

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
          <article className="diagnostic-layer">
            <DiagnosticHeader title="Agent 层" payload={[repetition.data?.data, executionTrace.data?.data]} />
            <RepetitionSummary value={repetition.data?.data} unavailable={repetition.isError} />
            <ArtifactInventory values={compactArtifacts([executionTrace.data?.data])} unavailable={executionTrace.isError} onOpen={(artifactId) => navigateWithContext(artifactPath(runId, repetitionId, artifactId))} />
          </article>
          <article className="diagnostic-layer">
            <DiagnosticHeader title="SMPP Provider 层" payload={[capabilities.data?.data, artifacts.data?.data]} />
            <ArtifactInventory values={compactArtifacts([...(capabilities.data?.data ?? []), ...(artifacts.data?.data ?? [])])} unavailable={capabilities.isError || artifacts.isError} onOpen={(artifactId) => navigateWithContext(artifactPath(runId, repetitionId, artifactId))} />
          </article>
          <article className="diagnostic-layer">
            <DiagnosticHeader title="Physical 层" payload={[physicalVerification.data?.data, faultAttribution.data?.data]} />
            <ArtifactInventory values={compactArtifacts([physicalVerification.data?.data, faultAttribution.data?.data])} unavailable={physicalVerification.isError || faultAttribution.isError} onOpen={(artifactId) => navigateWithContext(artifactPath(runId, repetitionId, artifactId))} />
          </article>
        </div>
      </SectionCard>

      {repetitionEvaluation.data && <SectionCard title="Selected Repetition Evaluation" extra={<ApiStatusTag compact meta={repetitionEvaluation.data.meta} />}>
        <Descriptions bordered size="small" column={4} items={[
          { key: "id", label: "Evaluation", children: <code>{repetitionEvaluation.data.data.evaluationId}</code> },
          { key: "ready", label: "Readiness", children: repetitionEvaluation.data.data.readiness },
          { key: "scoreStatus", label: "Score Status", children: <Tag>{repetitionEvaluation.data.data.scoreStatus}</Tag> },
          { key: "score", label: "Quality Score", children: repetitionEvaluation.data.data.qualityScore ?? "—" },
          { key: "level", label: "Level", children: repetitionEvaluation.data.data.level },
          { key: "passed", label: "Passed", children: String(repetitionEvaluation.data.data.passed) },
          { key: "class", label: "Data Class", children: <DataClassTag value={repetitionEvaluation.data.data.dataClass} /> },
          { key: "reason", label: "Reasons", children: repetitionEvaluation.data.data.reasonCodes.join(" · ") || "—" },
        ]} />
      </SectionCard>}

      {substitutions.data && <SectionCard title="Substitution Inventory" extra={<ApiStatusTag compact meta={substitutions.data.meta} />}>
        <Table rowKey="caseId" size="small" pagination={false} dataSource={substitutions.data.data} columns={[
          { title: "Case", dataIndex: "caseId", render: (value: string) => <code>{value}</code> },
          { title: "Track", dataIndex: "track", render: (value: string) => <Tag>{value}</Tag> },
          { title: "Scenario", dataIndex: "scenarioFamily", render: (value: string | null) => value ?? "—" },
          { title: "Fault", dataIndex: "faultType", render: (value: string | null) => value ?? "—" },
          { title: "Data Class", dataIndex: "dataClass", render: (value: string) => <DataClassTag value={value} /> },
          { title: "Formal", dataIndex: "formalEligible", render: (value: unknown) => <Tag color="red">{String(value)}</Tag> },
        ]} />
      </SectionCard>}

      {(productTimeline.data || runEvents.data) && <SectionCard title="Run / Repetition Timeline" extra={<DebugPayloadDrawer payload={productTimeline.data?.data ?? runEvents.data?.data} />}><RunTimeline values={productTimeline.data?.data ?? runEvents.data!.data} /></SectionCard>}

      {dashboard.data && (
        <DashboardProjection
          data={dashboard.data.data}
          navigateWithContext={navigateWithContext}
        />
      )}
      {dashboard.isError && (
        <SectionCard title="Evidence Projection">
          <Alert type="warning" showIcon message="Dashboard 投影暂不可用" description="这不会覆盖或改变 PostgreSQL Run Authority 状态。" />
        </SectionCard>
      )}

      {repetitions.length > 0 && <SectionCard title="Rerun selected Cases">
        <RerunRequestPanel cases={repetitions.map((item) => ({ caseId: item.caseId ?? item.repetitionId }))} pending={rerun.isPending} onSubmit={(input) => rerun.mutate(input)} />
      </SectionCard>}
    </div>
  );
}

function DashboardProjection({
  data,
  navigateWithContext,
}: {
  data: Awaited<ReturnType<typeof consoleApi.getRun>>["data"];
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
      <SectionCard title="Evidence Funnel / Release Gate 投影" className="detail-span-12" extra={<DebugPayloadDrawer payload={{ evidenceFunnel: data.evidenceFunnel, releaseGate: data.releaseGateDetail }} />}>
        <ProjectionSummary evidenceFunnel={data.evidenceFunnel} releaseGate={data.releaseGateDetail} />
      </SectionCard>
      <SectionCard title="用例矩阵" extra={<ApiStatusTag compact meta={caseMeta} />} className="detail-span-12 table-card">
        <Table<CaseResult> rowKey="caseId" columns={columns} dataSource={data.cases} pagination={false} scroll={{ x: 980 }} />
      </SectionCard>
    </div>
  );
}

function DiagnosticHeader({ title, payload }: { title: string; payload: unknown }) {
  return (
    <header className="diagnostic-layer-header">
      <h3>{title}</h3>
      <DebugPayloadDrawer payload={payload} label="Debug" />
    </header>
  );
}

function RepetitionSummary({ value, unavailable }: { value?: DiagnosticRepetition; unavailable: boolean }) {
  if (!value) return <span className="diagnostic-muted">{unavailable ? "unavailable" : "pending"}</span>;
  return <Descriptions size="small" column={1} items={[
    { key: "case", label: "Case Version", children: <code>{value.benchmarkCaseVersionId}</code> },
    { key: "state", label: "Authority State", children: <Tag color={value.terminalState ? "green" : "blue"}>{value.state}</Tag> },
    { key: "terminal", label: "Terminal State", children: value.terminalState ?? "—" },
    { key: "candidate", label: "Candidate Task", children: value.candidateTaskId ?? "—" },
    { key: "episode", label: "Episode", children: value.episodeId ?? "—" },
    { key: "revision", label: "Authority Revision", children: value.authorityRevision },
    { key: "failure", label: "Failure", children: value.failureCode ?? value.failureClass ?? "—" },
  ]} />;
}

function ArtifactInventory({ values, unavailable, onOpen }: { values: DiagnosticArtifact[]; unavailable: boolean; onOpen: (artifactId: string) => void }) {
  if (values.length === 0) return <span className="diagnostic-muted">{unavailable ? "unavailable / artifact not present" : "pending"}</span>;
  return <Table<DiagnosticArtifact>
    className="diagnostic-artifact-table"
    rowKey="relationId"
    size="small"
    pagination={false}
    dataSource={values}
    columns={[
      { title: "Kind", dataIndex: "artifactKind", render: (value: string) => <Tag>{value}</Tag> },
      { title: "Revision", dataIndex: "artifactRevision" },
      { title: "Media", render: (_, row) => row.artifactRef.mediaType },
      { title: "Size", render: (_, row) => `${row.artifactRef.sizeBytes} B` },
      { title: "Summary", dataIndex: "summary", render: (value: Record<string, unknown>) => <SummaryFields value={value} /> },
      { title: "Content", render: (_, row) => <Button type="link" disabled={!row.artifactRef.artifactId} onClick={() => row.artifactRef.artifactId && onOpen(row.artifactRef.artifactId)}>打开</Button> },
    ]}
  />;
}

function SummaryFields({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value).slice(0, 5);
  if (entries.length === 0) return <span>—</span>;
  return <div className="typed-summary-fields">{entries.map(([key, item]) => <span key={key}><b>{key}</b> {displayField(item)}</span>)}</div>;
}

function RunTimeline({ values }: { values: Array<RunEvent | RunTimelineEvent> }) {
  return <Table<RunEvent | RunTimelineEvent>
    rowKey={(row) => `${row.scope}:${row.revision}:${row.eventHash}`}
    size="small"
    pagination={values.length > 20 ? { pageSize: 20 } : false}
    dataSource={values}
    columns={[
      { title: "Time", dataIndex: "createdAt" },
      { title: "Scope", dataIndex: "scope", render: (value: string) => <Tag>{value}</Tag> },
      { title: "Revision", dataIndex: "revision" },
      { title: "Event", dataIndex: "eventKind" },
      { title: "Repetition", dataIndex: "repetitionId", render: (value: string | null | undefined) => value ?? "—" },
      { title: "Case Execution", dataIndex: "caseExecutionId", render: (value: string | null | undefined) => value ?? "—" },
    ]}
  />;
}

function ProjectionSummary({ evidenceFunnel, releaseGate }: { evidenceFunnel: unknown; releaseGate: unknown }) {
  const rows = [
    ...flattenSummary("Evidence", evidenceFunnel),
    ...flattenSummary("Release Gate", releaseGate),
  ];
  if (rows.length === 0) return <Alert type="info" showIcon message="Projection 尚无可读字段" />;
  return <Table
    rowKey={(row) => `${row.group}:${row.field}`}
    size="small"
    pagination={false}
    dataSource={rows}
    columns={[
      { title: "Group", dataIndex: "group", render: (value: string) => <Tag>{value}</Tag> },
      { title: "Field", dataIndex: "field" },
      { title: "Value", dataIndex: "value" },
    ]}
  />;
}

function flattenSummary(group: string, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  return Object.entries(input as Record<string, unknown>).slice(0, 24).map(([field, value]) => ({ group, field, value: displayField(value) }));
}

function compactArtifacts(values: Array<DiagnosticArtifact | undefined>): DiagnosticArtifact[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (!value || seen.has(value.relationId)) return [];
    seen.add(value.relationId);
    return [value];
  });
}

function displayField(value: unknown): string {
  if (value == null) return "—";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (Array.isArray(value)) return value.map(displayField).join(" · ");
  return "typed object";
}

function extractRepetitions(input: unknown[] | undefined): Array<{ repetitionId: string; caseId: string | null }> {
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

function artifactPath(runId: string, repetitionId: string | null | undefined, artifactId: string) {
  return `/runs/${encodeURIComponent(runId)}/repetitions/${encodeURIComponent(repetitionId ?? "unknown")}/artifacts/${encodeURIComponent(artifactId)}`;
}
