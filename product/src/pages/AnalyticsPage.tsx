import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Select, Table, Tag } from "antd";
import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard, SnapshotAlert } from "../components/common";
import {
  EvidenceFunnelChart,
  MetricHeatmap,
  QualityTrendChart,
  SummaryBars,
  TrackRiskHeatmap,
} from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import { displayValue, signedDelta } from "../utils/format";

export function AnalyticsPage() {
  const { filters, setFilters, navigateWithContext } = useAnalysisContext();
  const query = useQuery({
    queryKey: ["analytics", filters.candidateId, filters.baselineId, filters.datasetVersion, filters.profileVersionId, filters.runId, filters.track, filters.risk, filters.period, filters.scenario, filters.dataState],
    queryFn: () => consoleApi.getAnalytics(filters),
  });
  const data = query.data?.data;
  const summaries = useMemo(() => {
    if (!data) return { tracks: [], risks: [] };
    const average = (values: Array<number | null>) => {
      const valid = values.filter((value): value is number => value != null);
      return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
    };
    const tracks = ["core", "skill", "mcp", "node", "cross"].map((track) => ({ label: track.toUpperCase(), value: average(data.trackRiskMatrix.filter((item) => item.track === track).map((item) => item.passRate)) }));
    const risks = ["critical", "high", "medium", "low"].map((risk) => ({ label: risk, value: average(data.trackRiskMatrix.filter((item) => item.risk === risk).map((item) => item.passRate)) }));
    return { tracks, risks };
  }, [data]);

  if (!data || !query.data) {
    return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 Analytics Snapshot…</div></SectionCard></div>;
  }

  const operationalColumns = [
    { title: "Metric", dataIndex: "metric", key: "metric" },
    { title: "Current", dataIndex: "current", key: "current", render: (value: number | null, row: { unit: string }) => displayValue(value, row.unit) },
    { title: "Baseline", dataIndex: "baseline", key: "baseline", render: (value: number | null, row: { unit: string }) => displayValue(value, row.unit) },
    { title: "Change", dataIndex: "changePercent", key: "change", render: (value: number | null) => value == null ? "—" : <span className={value > 10 ? "text-warning" : "text-positive"}>{signedDelta(value, "%")}</span> },
    { title: "Scoring", key: "scoring", render: () => <Tag color="default">NON-SCORING</Tag> },
  ];

  return (
    <div className="standard-page analytics-page">
      <PageHeader
        title="Analytics Workspace"
        subtitle="同一 Snapshot 水位下的 Track、Risk、M1–M15、Evidence Readiness 与 Operational 深度分析。"
        meta={query.data.meta}
        actions={<><Select value={filters.period} options={[{ value: "7d", label: "最近 7 天" }, { value: "14d", label: "最近 14 天" }, { value: "30d", label: "最近 30 天" }]} onChange={(period) => setFilters({ period })} /><Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button></>}
      />
      <SnapshotAlert status={data.snapshot.dataStatus} watermark={data.snapshot.watermark} lagMs={data.snapshot.projectionLagMs} moduleErrors={data.snapshot.moduleErrors} />
      <div className="analytics-context-strip">
        <span>Candidate <button onClick={() => navigateWithContext(`/candidates/${filters.candidateId}`)}>{filters.candidateId}</button></span>
        <span>Baseline <button onClick={() => navigateWithContext(`/baselines/${filters.baselineId}`)}>{filters.baselineId}</button></span>
        <span>Run <button onClick={() => navigateWithContext(`/runs/${filters.runId}`)}>{filters.runId}</button></span>
        <span>Watermark <b>{data.snapshot.watermark.slice(11, 19)}</b></span>
      </div>
      <div className="analytics-grid">
        <SectionCard title="Quality Trend" extra={<Button type="link" onClick={() => navigateWithContext(`/compare/CMP-20260815-004`)}>Compare <ArrowRightOutlined /></Button>} className="analytics-span-8 analytics-chart-lg">
          <QualityTrendChart data={data.qualityTrend} onPoint={() => navigateWithContext("/runs")} />
        </SectionCard>
        <SectionCard title="Track Summary" className="analytics-span-2 analytics-chart-lg"><SummaryBars data={summaries.tracks} /></SectionCard>
        <SectionCard title="Risk Summary" className="analytics-span-2 analytics-chart-lg"><SummaryBars data={summaries.risks} /></SectionCard>
        <SectionCard title="Track × Risk Pass Rate" className="analytics-span-5 analytics-chart-md">
          <TrackRiskHeatmap data={data.trackRiskMatrix} onCell={(track, risk) => { setFilters({ track, risk }); navigateWithContext("/cases", { track, risk }); }} />
        </SectionCard>
        <SectionCard title="Evidence Readiness Funnel" className="analytics-span-3 analytics-chart-md"><EvidenceFunnelChart data={data.evidenceReadinessFunnel} /></SectionCard>
        <SectionCard title="Operational Signals" extra={<Tag color="default">不影响 Quality Score</Tag>} className="analytics-span-4 table-card">
          <Table rowKey="metric" columns={operationalColumns} dataSource={data.operationalSummary} pagination={false} size="small" />
        </SectionCard>
        <SectionCard title="M1–M15 × Track" extra={<span className="text-muted">点击单元格查看对应 Case</span>} className="analytics-span-12 analytics-heatmap-card">
          <MetricHeatmap data={data.metricHeatmap} onCell={(metric, track) => navigateWithContext("/cases", { metric, track: track.toLowerCase() })} />
        </SectionCard>
      </div>
    </div>
  );
}
