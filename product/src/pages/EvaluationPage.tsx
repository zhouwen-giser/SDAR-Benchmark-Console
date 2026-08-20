import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Empty, Table, Tabs, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
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
    return <><ApiStatusTag compact meta={resource.data.meta} /><pre className="evaluation-tab-json">{JSON.stringify(payload, null, 2)}</pre></>;
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
