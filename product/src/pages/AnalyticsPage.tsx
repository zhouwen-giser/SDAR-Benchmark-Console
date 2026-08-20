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
import { displayValue, riskName, signedDelta, trackName } from "../utils/format";

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
    const tracks = ["core", "skill", "mcp", "node", "cross"].map((track) => ({ label: trackName(track), value: average(data.trackRiskMatrix.filter((item) => item.track === track).map((item) => item.passRate)) }));
    const risks = ["critical", "high", "medium", "low"].map((risk) => ({ label: riskName(risk), value: average(data.trackRiskMatrix.filter((item) => item.risk === risk).map((item) => item.passRate)) }));
    return { tracks, risks };
  }, [data]);

  if (!data || !query.data) {
    return <div className="standard-page"><SectionCard><div className="page-loading">正在加载指标分析快照…</div></SectionCard></div>;
  }

  const operationalColumns = [
    { title: "指标", dataIndex: "metric", key: "metric" },
    { title: "当前值", dataIndex: "current", key: "current", render: (value: number | null, row: { unit: string }) => displayValue(value, row.unit) },
    { title: "基准值", dataIndex: "baseline", key: "baseline", render: (value: number | null, row: { unit: string }) => displayValue(value, row.unit) },
    { title: "变化", dataIndex: "changePercent", key: "change", render: (value: number | null) => value == null ? "—" : <span className={value > 10 ? "text-warning" : "text-positive"}>{signedDelta(value, "%")}</span> },
    { title: "评分属性", key: "scoring", render: () => <Tag color="default">不参与质量评分</Tag> },
  ];

  return (
    <div className="standard-page analytics-page">
      <PageHeader
        title="指标分析工作区"
        subtitle="在同一数据快照水位下，分析分轨、风险、M1–M15 指标、证据就绪度与运行信号。"
        meta={query.data.meta}
        actions={<><Select value={filters.period} options={[{ value: "7d", label: "最近 7 天" }, { value: "14d", label: "最近 14 天" }, { value: "30d", label: "最近 30 天" }]} onChange={(period) => setFilters({ period })} /><Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button></>}
      />
      <SnapshotAlert status={data.snapshot.dataStatus} watermark={data.snapshot.watermark} lagMs={data.snapshot.projectionLagMs} moduleErrors={data.snapshot.moduleErrors} />
      <div className="analytics-context-strip">
        <span>候选版本 <button onClick={() => navigateWithContext(`/candidates/${filters.candidateId}`)}>{filters.candidateId}</button></span>
        <span>基准版本 <button onClick={() => navigateWithContext(`/baselines/${filters.baselineId}`)}>{filters.baselineId}</button></span>
        <span>评测运行 <button onClick={() => navigateWithContext(`/runs/${filters.runId}`)}>{filters.runId}</button></span>
        <span>数据水位 <b>{data.snapshot.watermark.slice(11, 19)}</b></span>
      </div>
      <div className="analytics-grid">
        <SectionCard title="质量趋势" extra={<Button type="link" onClick={() => navigateWithContext(`/compare/CMP-20260815-004`)}>查看比较 <ArrowRightOutlined /></Button>} className="analytics-span-8 analytics-chart-lg">
          <QualityTrendChart data={data.qualityTrend} onPoint={() => navigateWithContext("/runs")} />
        </SectionCard>
        <SectionCard title="分轨摘要" className="analytics-span-2 analytics-chart-lg"><SummaryBars data={summaries.tracks} /></SectionCard>
        <SectionCard title="风险摘要" className="analytics-span-2 analytics-chart-lg"><SummaryBars data={summaries.risks} /></SectionCard>
        <SectionCard title="分轨 × 风险通过率" className="analytics-span-5 analytics-chart-md">
          <TrackRiskHeatmap data={data.trackRiskMatrix} onCell={(track, risk) => { setFilters({ track, risk }); navigateWithContext("/cases", { track, risk }); }} />
        </SectionCard>
        <SectionCard title="证据就绪漏斗" className="analytics-span-3 analytics-chart-md"><EvidenceFunnelChart data={data.evidenceReadinessFunnel} /></SectionCard>
        <SectionCard title="运行信号" extra={<Tag color="default">不影响质量得分</Tag>} className="analytics-span-4 table-card">
          <Table rowKey="metric" columns={operationalColumns} dataSource={data.operationalSummary} pagination={false} size="small" />
        </SectionCard>
        <SectionCard title="M1–M15 × 分轨" extra={<span className="text-muted">点击单元格查看对应测试用例</span>} className="analytics-span-12 analytics-heatmap-card">
          <MetricHeatmap data={data.metricHeatmap} onCell={(metric, track) => navigateWithContext("/cases", { metric, track: track.toLowerCase() })} />
        </SectionCard>
      </div>
    </div>
  );
}
