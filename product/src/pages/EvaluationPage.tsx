import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Progress, Table, Tag, Timeline } from "antd";
import { ArrowRightOutlined, CheckCircleFilled, CloseCircleFilled, LinkOutlined, WarningFilled } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvaluationDetail } from "../types";
import { displayValue } from "../utils/format";

const metricGroups = [
  { label: "Goal & State", ids: ["M1", "M2", "M3", "M4"] },
  { label: "Planning", ids: ["M5", "M6", "M7"] },
  { label: "Decision & Safety", ids: ["M8", "M9", "M10"] },
  { label: "Execution & Evidence", ids: ["M11", "M12", "M13"] },
  { label: "Closure", ids: ["M14", "M15"] },
];

function gateTag(result: string) {
  if (result === "pass") return <Tag color="green" icon={<CheckCircleFilled />}>PASS</Tag>;
  if (result === "fail") return <Tag color="red" icon={<CloseCircleFilled />}>FAIL</Tag>;
  return <Tag color="gold" icon={<WarningFilled />}>INSUFFICIENT EVIDENCE</Tag>;
}

export function EvaluationPage() {
  const { evaluationId = "eval-mcp17" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["evaluation", evaluationId], queryFn: () => consoleApi.getEvaluation(evaluationId) });
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 typed Evaluation…</div></SectionCard></div>;
  const data = query.data.data;
  const metricMeta = capabilityMeta("evaluationMetrics", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const evidenceMeta = capabilityMeta("evidenceDiff", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const metricColumns = [
    { title: "Metric", dataIndex: "id", key: "id" },
    { title: "Raw", dataIndex: "raw", key: "raw", render: (value: number | null) => <Tag color={value === 0 ? "red" : value === 1 ? "gold" : "green"}>{displayValue(value)}/2</Tag> },
    { title: "Weight", dataIndex: "weight", key: "weight" },
    { title: "Evidence", dataIndex: "evidenceLevel", key: "evidenceLevel", render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: "Formalization", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "formal" ? "green" : "purple"}>{value}</Tag> },
    { title: "Summary", dataIndex: "summary", key: "summary" },
  ];

  return (
    <div className="standard-page evaluation-page">
      <PageHeader
        title={`Evaluation ${data.evaluationId}`}
        subtitle={`${data.caseId} · ${data.origin} · ${data.profile} · ${data.episodeId}`}
        meta={query.data.meta}
        actions={<Button type="primary" icon={<LinkOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`)}>打开 Evidence Bundle</Button>}
      />
      <div className="evaluation-hero">
        <SectionCard className={`evaluation-verdict verdict-${data.level.toLowerCase()}`}><span>VERDICT</span><strong>{data.level}</strong><small>{data.passed ? "PASSED" : "BLOCKED"}</small></SectionCard>
        <SectionCard className="evaluation-score"><span>Quality Score</span><strong>{displayValue(data.qualityScore)}</strong><Tag color={data.scoreStatus === "formal" ? "green" : "purple"}>{data.scoreStatus.toUpperCase()}</Tag></SectionCard>
        <SectionCard className="evaluation-summary-card">
          <Descriptions size="small" column={4} items={[
            { key: "origin", label: "Origin", children: data.origin },
            { key: "source", label: "Source Readiness", children: <Tag color="green">{data.readiness.source}</Tag> },
            { key: "evaluation", label: "Evaluation Readiness", children: <Tag color="green">{data.readiness.evaluation}</Tag> },
            { key: "bundle", label: "Bundle", children: <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`)}>{data.bundleId}</button> },
            { key: "profile", label: "Profile / Rules", children: data.profile },
            { key: "missing", label: "Missing", children: data.readiness.missing.length ? data.readiness.missing.join(", ") : "None" },
            { key: "conflicts", label: "Conflicts", children: data.readiness.conflicts.length ? data.readiness.conflicts.join(", ") : "None" },
            { key: "level", label: "Score Status", children: data.scoreStatus },
          ]} />
        </SectionCard>
      </div>
      <div className="evaluation-grid">
        <SectionCard title="Readiness" className="evaluation-span-4">
          <Timeline items={[
            { color: "green", children: <><b>Source Evidence complete</b><p>Manifest sealed · Bundle complete</p></> },
            { color: "green", children: <><b>Evaluation ready</b><p>No missing/conflicting family at evaluation start</p></> },
            { color: "blue", children: <><b>Typed result projected</b><p>Watermarked Evaluation view</p></> },
          ]} />
        </SectionCard>
        <SectionCard title="Fatal F1–F7" className="evaluation-span-4">
          <div className="fatal-grid">{data.fatals.map((item) => <div key={item.id}><b>{item.id}</b><Tag color={item.matched ? "red" : "green"}>{item.matched ? "MATCHED" : "NOT MATCHED"}</Tag><span>{item.evidenceLevel}</span></div>)}</div>
        </SectionCard>
        <SectionCard title="Hard Gates HG1–HG7" className="evaluation-span-4">
          <div className="gate-list">{data.gates.map((item) => <button key={item.id} className={item.result === "fail" ? "gate-failed" : ""} onClick={() => item.id === "HG4" ? navigateWithContext(`/evidence-bundles/${data.bundleId}`, { tab: "diff", focus: "receipt-R1" }) : undefined}><b>{item.id}</b><span>{item.reason ?? "Required condition satisfied"}</span>{gateTag(item.result)}{item.id === "HG4" && <ArrowRightOutlined />}</button>)}</div>
        </SectionCard>
        <SectionCard title="M1–M15 Metric Results" extra={<ApiStatusTag compact meta={metricMeta} />} className="evaluation-span-12 table-card">
          <div className="metric-group-strip">{metricGroups.map((group) => <div key={group.label}><b>{group.label}</b><span>{group.ids.join(" · ")}</span></div>)}</div>
          <Table<EvaluationDetail["metrics"][number]> rowKey="id" columns={metricColumns} dataSource={data.metrics} pagination={false} size="small" rowClassName={(row) => row.raw === 0 ? "critical-table-row" : ""} />
        </SectionCard>
        <SectionCard title="Five Dimensions" className="evaluation-span-6">
          <div className="dimension-progress-list">{data.dimensions.map((item) => <div key={item.id}><span>{item.id} · {item.label}</span><Progress percent={item.score} strokeColor={item.score < 50 ? "#ef4444" : item.score < 75 ? "#f5b942" : "#28c76f"} /></div>)}</div>
        </SectionCard>
        <SectionCard title="Verified Findings" extra={<ApiStatusTag compact meta={evidenceMeta} />} className="evaluation-span-6">
          <div className="finding-list">{data.findings.map((item) => <article key={item.title}><Tag color="red">{item.severity.toUpperCase()}</Tag><div><h3>{item.title}</h3><p>{item.summary}</p><small>Evidence: {item.evidenceRefs.join(", ")}</small><b>建议：{item.recommendedAction}</b></div><Button type="link" onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`, { tab: "diff" })}>Evidence Diff <ArrowRightOutlined /></Button></article>)}</div>
        </SectionCard>
      </div>
    </div>
  );
}
