import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Empty, Space, Table, Tabs, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, DebugPayloadDrawer, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type {
  EvaluationDimensionView,
  EvaluationEvidenceGradeView,
  EvaluationEvidenceLinksView,
  EvaluationFatalView,
  EvaluationFindingView,
  EvaluationHardGateView,
  EvaluationMetricView,
  EvaluationReadinessView,
  TelemetryProvenanceView,
} from "../types";
import { displayValue, readinessName, scoreStatusName, sourceName, verdictName } from "../utils/format";

export function EvaluationPage() {
  const { evaluationId = "unavailable" } = useParams();
  const { searchParams, setQueryParams, navigateWithContext } = useAnalysisContext();
  const active = searchParams.get("tab") ?? "readiness";
  const header = useQuery({ queryKey: ["evaluation-header", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationHeader(evaluationId, { signal }) });
  const readiness = useQuery({ queryKey: ["evaluation-readiness", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationReadiness(evaluationId, { signal }), enabled: active === "readiness" });
  const grades = useQuery({ queryKey: ["evaluation-evidence-grades", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationEvidenceGrades(evaluationId, { signal }), enabled: active === "evidence-grades" });
  const fatals = useQuery({ queryKey: ["evaluation-fatals", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationFatals(evaluationId, { signal }), enabled: active === "fatals" });
  const gates = useQuery({ queryKey: ["evaluation-hard-gates", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationHardGates(evaluationId, { signal }), enabled: active === "hard-gates" });
  const metrics = useQuery({ queryKey: ["evaluation-metrics", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationMetrics(evaluationId, { signal }), enabled: active === "metrics" });
  const dimensions = useQuery({ queryKey: ["evaluation-dimensions", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationDimensions(evaluationId, { signal }), enabled: active === "dimensions" });
  const findings = useQuery({ queryKey: ["evaluation-findings", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationFindings(evaluationId, { signal }), enabled: active === "findings" });
  const links = useQuery({ queryKey: ["evaluation-evidence-links", evaluationId], queryFn: ({ signal }) => consoleApi.getEvaluationEvidenceLinks(evaluationId, { signal }), enabled: active === "evidence-links" });
  const provenance = useQuery({ queryKey: ["evaluation-provenance", evaluationId], queryFn: ({ signal }) => consoleApi.getTelemetryProvenance(evaluationId, { signal }), enabled: active === "telemetry-provenance" || active === "evaluation-input", staleTime: Infinity });

  if (!header.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载评价 Header…</div></SectionCard></div>;
  const data = header.data.data;
  const resource = { readiness, "evidence-grades": grades, fatals, "hard-gates": gates, metrics, dimensions, findings, "evidence-links": links, "telemetry-provenance": provenance, "evaluation-input": provenance }[active];

  const renderResource = () => {
    if (!resource || resource.isLoading) return <div className="page-loading">正在按需加载 {active}…</div>;
    if (resource.isError) return <Alert type="error" showIcon message={`${active} unavailable`} description={resource.error instanceof Error ? resource.error.message : "请求失败"} />;
    if (!resource.data) return <Empty />;
    if (active === "evaluation-input") {
      const input = provenance.data?.data;
      return input ? <div className="evaluation-input-panel">
        <Descriptions bordered column={2} items={[
          { key: "id", label: "Snapshot ID / Hash", children: <><code>{input.inputSnapshotId}</code><br /><code>{input.inputSnapshotContentHash}</code></> },
          { key: "ready", label: "Overall Readiness", children: <Tag color={input.overallReadiness === "ready" ? "green" : "gold"}>{input.overallReadiness}</Tag> },
          { key: "eligible", label: "Formal Input Eligible", children: <Tag color={input.formalInputEligible ? "green" : "red"}>{String(input.formalInputEligible)}</Tag> },
          { key: "watermark", label: "Effective Watermark", children: input.effectiveWatermark },
        ]} />
        <div className="source-reference-grid">{input.sources.map((source) => <SectionCard key={source.sourceType} title={source.sourceType === "canonical" ? "Canonical Evidence" : source.sourceType === "domain" ? "Domain Projection" : "MCP Provider Telemetry"}><p>Readiness: {source.readiness}</p><p>Watermark: {source.watermark ?? "—"}</p><code>{source.artifactUri ?? "—"}</code><br /><code>{source.artifactHash ?? "—"}</code></SectionCard>)}</div>
        <Button type="primary" onClick={() => navigateWithContext(`/evaluation-input-snapshots/${input.inputSnapshotId}`)}>打开不可变评价输入快照</Button>
      </div> : <Empty description="评价未关联 EvaluationInputSnapshot" />;
    }
    const payload = resource.data.data;
    return <>
      <div className="typed-resource-toolbar">
        <ApiStatusTag compact meta={resource.data.meta} />
        <DebugPayloadDrawer payload={payload} />
      </div>
      <EvaluationResource active={active} payload={payload} />
    </>;
  };

  const tabs = [
    ["readiness", "就绪状态"], ["evidence-grades", "证据等级"], ["fatals", "F1–F7"], ["hard-gates", "HG1–HG7"],
    ["metrics", "M1–M15"], ["dimensions", "五维能力"], ["findings", "发现"], ["evidence-links", "证据链接"],
    ["telemetry-provenance", "Telemetry Provenance"], ["evaluation-input", "评价输入"],
  ].map(([key, label]) => ({ key, label, children: <SectionCard className="evaluation-tab-card">{renderResource()}</SectionCard> }));

  return (
    <div className="standard-page evaluation-page">
      <PageHeader title={`评价结果 ${data.evaluationId}`} subtitle={`${data.caseId} · ${sourceName(data.origin)} · ${data.profileVersionId}`} meta={header.data.meta} actions={<Button icon={<LinkOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleSnapshotId}`)}>打开证据包</Button>} />
      <div className="evaluation-hero">
        <SectionCard className={`evaluation-verdict verdict-${data.level.toLowerCase()}`}><span>评价结论</span><strong>{verdictName(data.level)}</strong><small>{data.passed == null ? "unavailable" : data.passed ? "已通过" : "未通过"}</small></SectionCard>
        <SectionCard className="evaluation-score"><span>质量得分</span><strong>{displayValue(data.qualityScore)}</strong><Tag color={data.scoreStatus === "formal" ? "green" : "gold"}>{scoreStatusName(data.scoreStatus)}</Tag></SectionCard>
        <SectionCard className="evaluation-summary-card"><Descriptions size="small" column={4} items={[
          { key: "origin", label: "评价来源", children: sourceName(data.origin) }, { key: "readiness", label: "评价就绪度", children: readinessName(data.readiness) },
          { key: "episode", label: "Episode", children: data.episodeId ?? "—" }, { key: "bundle", label: "Bundle", children: data.bundleSnapshotId },
        ]} /></SectionCard>
      </div>
      <Tabs activeKey={active} items={tabs} onChange={(tab) => setQueryParams({ tab })} />
    </div>
  );
}

function EvaluationResource({ active, payload }: { active: string; payload: unknown }) {
  if (active === "readiness") {
    const value = payload as EvaluationReadinessView;
    return <Descriptions bordered size="small" column={2} items={[
      { key: "source", label: "Source Evidence", children: <StatusValue value={value.sourceEvidenceReadiness} /> },
      { key: "evaluation", label: "Evaluation", children: <StatusValue value={value.evaluationReadiness} /> },
      { key: "missing", label: "Missing Families", children: <ValueList values={value.missingFamilies} empty="无缺失" /> },
      { key: "conflicting", label: "Conflicting Families", children: <ValueList values={value.conflictingFamilies} empty="无冲突" /> },
      { key: "reasons", label: "Reason Codes", span: 2, children: <ValueList values={value.reasonCodes} empty="无" /> },
    ]} />;
  }
  if (active === "evidence-grades") {
    return <Table<EvaluationEvidenceGradeView>
      rowKey="family"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationEvidenceGradeView[]}
      columns={[
        { title: "Evidence Family", dataIndex: "family" },
        { title: "Grade", dataIndex: "grade", render: (value: string | null) => <StatusValue value={value} /> },
        { title: "Reason Codes", dataIndex: "reasonCodes", render: (values: string[]) => <ValueList values={values} /> },
        { title: "Evidence Refs", dataIndex: "evidenceRefs", render: (values: string[]) => <ReferenceList values={values} /> },
      ]}
    />;
  }
  if (active === "fatals") {
    return <Table<EvaluationFatalView>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationFatalView[]}
      columns={[
        { title: "Fatal", dataIndex: "id" },
        { title: "Matched", dataIndex: "matched", render: (value: boolean | null) => <StatusValue value={value == null ? null : value ? "matched" : "not_matched"} /> },
        { title: "Proof", dataIndex: "proofStatus", render: (value: string) => <StatusValue value={value} /> },
        { title: "Evidence Level", dataIndex: "evidenceLevel", render: (value: string | null) => value ?? "—" },
        { title: "Evidence", dataIndex: "evidenceRefs", render: (values: string[]) => <ReferenceList values={values} /> },
        { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => <ValueList values={values} /> },
      ]}
    />;
  }
  if (active === "hard-gates") {
    return <Table<EvaluationHardGateView>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationHardGateView[]}
      columns={[
        { title: "Hard Gate", dataIndex: "id" },
        { title: "Result", dataIndex: "result", render: (value: string) => <StatusValue value={value} /> },
        { title: "Reason", dataIndex: "reason", render: (value: string | null) => value ?? "—" },
        { title: "Reason Codes", dataIndex: "reasonCodes", render: (values: string[]) => <ValueList values={values} /> },
        { title: "Evidence", dataIndex: "evidenceRefs", render: (values: string[]) => <ReferenceList values={values} /> },
      ]}
    />;
  }
  if (active === "metrics") {
    return <Table<EvaluationMetricView>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationMetricView[]}
      columns={[
        { title: "Metric", dataIndex: "id" },
        { title: "Status", dataIndex: "status", render: (value: string) => <StatusValue value={value} /> },
        { title: "Raw", dataIndex: "raw", render: (value: number | null) => displayValue(value) },
        { title: "Weight", dataIndex: "weight", render: (value: number | null) => displayValue(value) },
        { title: "Evidence Level", dataIndex: "evidenceLevel", render: (value: string | null) => value ?? "—" },
        { title: "Summary", dataIndex: "summary", render: (value: string | null) => value ?? "—" },
        { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => <ValueList values={values} /> },
      ]}
    />;
  }
  if (active === "dimensions") {
    return <Table<EvaluationDimensionView>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationDimensionView[]}
      columns={[
        { title: "Dimension", dataIndex: "label", render: (value: string, row) => <><b>{value}</b><br /><code>{row.id}</code></> },
        { title: "Score", dataIndex: "score", render: (value: number | null) => displayValue(value) },
        { title: "Threshold", dataIndex: "threshold", render: (value: number | null) => displayValue(value) },
        { title: "Status", dataIndex: "passed", render: (value: boolean | null, row) => <StatusValue value={!row.applicable ? "not_applicable" : value == null ? "unavailable" : value ? "passed" : "failed"} /> },
        { title: "Metrics", dataIndex: "metricIds", render: (values: string[]) => <ValueList values={values} /> },
      ]}
    />;
  }
  if (active === "findings") {
    return <Table<EvaluationFindingView>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={payload as EvaluationFindingView[]}
      columns={[
        { title: "Finding", dataIndex: "id" },
        { title: "Type", dataIndex: "type" },
        { title: "Severity", dataIndex: "severity", render: (value: string | null) => <StatusValue value={value} /> },
        { title: "Summary", dataIndex: "summary" },
        { title: "Priority", dataIndex: "priority", render: (value: string | null) => value ?? "—" },
        { title: "Evidence", dataIndex: "evidenceRefs", render: (values: string[]) => <ReferenceList values={values} /> },
      ]}
    />;
  }
  if (active === "evidence-links") {
    const value = payload as EvaluationEvidenceLinksView;
    return <>
      <Descriptions bordered size="small" column={2} items={[
        { key: "evaluation", label: "Evaluation", children: <code>{value.evaluationId}</code> },
        { key: "bundle", label: "Bundle", children: <code>{value.bundleSnapshotId}</code> },
        { key: "bundleHash", label: "Bundle Hash", children: <code>{value.bundleContentHash ?? "—"}</code> },
        { key: "input", label: "Input Snapshot", children: <code>{value.inputSnapshotId ?? "—"}</code> },
        { key: "eligible", label: "Formal Input Eligible", children: <StatusValue value={value.formalInputEligible == null ? null : value.formalInputEligible ? "true" : "false"} /> },
        { key: "readiness", label: "Composite Readiness", children: <StatusValue value={value.compositeReadiness} /> },
        { key: "watermark", label: "Input Watermark", children: value.inputSourceWatermark ?? "—" },
        { key: "refs", label: "Evidence Refs", children: <ReferenceList values={value.evidenceRefs} /> },
      ]} />
      <SourceReferenceTable values={value.inputSourceRefs} />
    </>;
  }
  if (active === "telemetry-provenance") {
    const value = payload as TelemetryProvenanceView;
    return <>
      <Descriptions bordered size="small" column={2} items={[
        { key: "evaluation", label: "Evaluation", children: <code>{value.evaluationId}</code> },
        { key: "origin", label: "Origin", children: value.origin },
        { key: "snapshot", label: "Input Snapshot", children: <code>{value.inputSnapshotId}</code> },
        { key: "hash", label: "Snapshot Hash", children: <code>{value.inputSnapshotContentHash}</code> },
        { key: "readiness", label: "Overall Readiness", children: <StatusValue value={value.overallReadiness} /> },
        { key: "eligible", label: "Formal Input Eligible", children: <StatusValue value={value.formalInputEligible ? "true" : "false"} /> },
        { key: "watermark", label: "Effective Watermark", span: 2, children: value.effectiveWatermark },
      ]} />
      <SourceReferenceTable values={value.sources} />
    </>;
  }
  return <Empty description="该资源暂无类型化展示" />;
}

function SourceReferenceTable({ values }: { values: TelemetryProvenanceView["sources"] }) {
  return <Table
    className="typed-source-table"
    rowKey={(row) => `${row.sourceType}:${row.artifactHash ?? row.artifactUri ?? "unavailable"}`}
    size="small"
    pagination={false}
    dataSource={values}
    columns={[
      { title: "Source", dataIndex: "sourceType" },
      { title: "Required", dataIndex: "required", render: (value: boolean | null) => value == null ? "—" : value ? "是" : "否" },
      { title: "Readiness", dataIndex: "readiness", render: (value: string) => <StatusValue value={value} /> },
      { title: "Watermark", dataIndex: "watermark", render: (value: string | null) => value ?? "—" },
      { title: "Artifact", dataIndex: "artifactUri", render: (value: string | null) => value ? <code>{value}</code> : "—" },
      { title: "Reasons", dataIndex: "reasonCodes", render: (items: string[]) => <ValueList values={items} /> },
    ]}
  />;
}

function StatusValue({ value }: { value: string | null | undefined }) {
  const normalized = value?.toLowerCase() ?? "unavailable";
  const positive = ["ready", "passed", "complete", "completed", "formal", "true", "not_matched"].includes(normalized);
  const negative = ["failed", "blocked", "matched", "false", "fatal"].includes(normalized);
  return <Tag color={positive ? "green" : negative ? "red" : normalized === "unavailable" || normalized === "not_ready" ? "gold" : "blue"}>{value ?? "unavailable"}</Tag>;
}

function ValueList({ values, empty = "—" }: { values: string[] | undefined; empty?: string }) {
  if (!values?.length) return <span>{empty}</span>;
  return <Space size={[4, 4]} wrap>{values.map((value) => <Tag key={value}>{value}</Tag>)}</Space>;
}

function ReferenceList({ values }: { values: string[] | undefined }) {
  if (!values?.length) return <span>—</span>;
  return <div className="typed-reference-list">{values.map((value) => <code key={value}>{value}</code>)}</div>;
}
