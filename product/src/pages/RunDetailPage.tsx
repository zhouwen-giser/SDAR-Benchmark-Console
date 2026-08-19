import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Progress, Table, Tag } from "antd";
import { ArrowRightOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { SummaryBars } from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseResult } from "../types";
import { displayValue } from "../utils/format";

export function RunDetailPage() {
  const { runId = "R-20260815-004" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["run", runId], queryFn: () => consoleApi.getRun(runId) });
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 Run Dashboard…</div></SectionCard></div>;
  const { data, meta } = query.data;
  const run = data.run;
  const caseMeta = capabilityMeta("runCases", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs });
  const columns = [
    { title: "Case ID", dataIndex: "caseId", key: "caseId", render: (value: string, row: CaseResult) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{value}</button> },
    { title: "Track", dataIndex: "track", key: "track" },
    { title: "Risk", dataIndex: "risk", key: "risk", render: (value: string) => <Tag color={value === "critical" ? "red" : value === "high" ? "orange" : "blue"}>{value}</Tag> },
    { title: "Repetitions", dataIndex: "repetitions", key: "repetitions" },
    { title: "Verdict", dataIndex: "verdict", key: "verdict", render: (value: string) => <Tag color={value === "HG" ? "red" : value === "A" ? "green" : "gold"}>{value}</Tag> },
    { title: "Score Mean", dataIndex: "score", key: "score", render: (value: number | null) => displayValue(value) },
    { title: "Stability", dataIndex: "stability", key: "stability", render: (value: number | null) => value == null ? "—" : <Progress percent={value} size="small" strokeColor={value < 70 ? "#ef4444" : "#28c76f"} /> },
    { title: "Baseline Δ", dataIndex: "baselineDelta", key: "baselineDelta", render: (value: number | null) => <span className={(value ?? 0) < 0 ? "text-danger" : "text-positive"}>{displayValue(value)}</span> },
    { title: "Failure Type", dataIndex: "failureType", key: "failureType" },
    { title: "Evaluation", key: "evaluation", render: (_: unknown, row: CaseResult) => <Button type="link" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>打开 <ArrowRightOutlined /></Button> },
  ];

  return (
    <div className="standard-page run-detail-page">
      <PageHeader
        title={`Run ${run.runId}`}
        subtitle={`${run.candidate} · ${run.dataset} · ${run.profile} · Snapshot ${data.snapshot.snapshotId}`}
        meta={meta}
        actions={<Button type="primary" onClick={() => navigateWithContext("/compare/CMP-20260815-004")}>与 Baseline 比较</Button>}
      />
      <div className="run-summary-grid">
        <SectionCard className={`run-gate-card gate-${run.releaseGate}`}>
          <SafetyCertificateOutlined />
          <div><span>RELEASE GATE</span><strong>{run.releaseGate.toUpperCase()}</strong><small>{run.hg} HG · {run.nr} NR</small></div>
        </SectionCard>
        {[
          ["Quality", run.qualityScore], ["Pass", `${run.passRate}%`], ["Fatal", run.fatal], ["Required HG", run.hg], ["Not Ready", run.nr], ["Coverage", `${run.completed}/${run.cases}`],
        ].map(([label, value]) => <SectionCard key={String(label)} className="run-stat-card"><span>{label}</span><strong>{displayValue(value)}</strong></SectionCard>)}
      </div>
      <div className="detail-grid">
        <SectionCard title="Run Authority / Context" className="detail-span-4">
          <Descriptions column={2} size="small" items={[
            { key: "status", label: "Authority status", children: <Tag color="green">{run.status}</Tag> },
            { key: "dataset", label: "Dataset", children: run.dataset },
            { key: "profile", label: "Profile", children: run.profile },
            { key: "watermark", label: "Watermark", children: data.snapshot.watermark },
            { key: "lag", label: "Projection lag", children: `${(data.snapshot.projectionLagMs / 1000).toFixed(1)}s` },
            { key: "source", label: "Source", children: "PG authority + CH projection" },
          ]} />
        </SectionCard>
        <SectionCard title="Track Summary" className="detail-span-4"><SummaryBars data={data.trackSummary} /></SectionCard>
        <SectionCard title="Risk Summary" className="detail-span-4"><SummaryBars data={data.riskSummary} /></SectionCard>
        <SectionCard title="Dimension Summary" className="detail-span-4"><SummaryBars data={data.dimensions.map((item) => ({ label: item.label, value: item.score }))} /></SectionCard>
        <SectionCard title="Repetition Stability" className="detail-span-4"><div className="stability-summary"><Progress type="dashboard" percent={80} strokeColor="#3b82f6" /><div><b>4 / 5 stable groups</b><span>MCP restart 33%</span><span>Skill area patrol 67%</span></div></div></SectionCard>
        <SectionCard title="Evidence Readiness" className="detail-span-4"><div className="mini-funnel-list">{[["Case",80],["Episode",80],["Manifest",79],["Bundle",76],["Ready",72],["Formal",68]].map(([label,value]) => <div key={String(label)}><span>{label}</span><Progress percent={Number(value)/80*100} size="small" format={() => String(value)} /></div>)}</div></SectionCard>
        <SectionCard title="Case Matrix" extra={<ApiStatusTag compact meta={caseMeta} />} className="detail-span-12 table-card">
          <Table<CaseResult> rowKey="caseId" columns={columns} dataSource={data.cases} pagination={false} scroll={{ x: 1200 }} />
        </SectionCard>
      </div>
    </div>
  );
}
