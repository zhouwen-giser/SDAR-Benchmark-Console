import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Table, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useParams } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, compactTimestamp } from "../operational/components";
import type { TrajectorySampleView } from "../operational/types";

export function TrajectoryPage() {
  const { runId = "", repetitionId = "" } = useParams();
  const query = useQuery({ queryKey: ["operational", "trajectory", runId, repetitionId], queryFn: () => operationalApi.getRepetitionTrajectory(runId, repetitionId), enabled: Boolean(runId && repetitionId) });
  const trajectory = query.data?.data;
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: "axis" }, legend: { textStyle: { color: "#9bb0c2" } }, grid: { left: 55, right: 20, top: 45, bottom: 45 },
    xAxis: { type: "value", name: "X", axisLabel: { color: "#9bb0c2" }, splitLine: { lineStyle: { color: "rgba(110,145,170,.18)" } } },
    yAxis: { type: "value", name: "Y", axisLabel: { color: "#9bb0c2" }, splitLine: { lineStyle: { color: "rgba(110,145,170,.18)" } } },
    series: [
      { name: "Trajectory", type: "line", smooth: 0.18, symbolSize: 5, data: (trajectory?.samples ?? []).map((sample) => point(sample.position)), lineStyle: { color: "#3cb8ff", width: 3 }, itemStyle: { color: "#3cb8ff" } },
      { name: "Target", type: "scatter", symbolSize: 18, data: trajectory?.target ? [point(trajectory.target)] : [], itemStyle: { color: "#ffb020" } },
      { name: "Final", type: "scatter", symbolSize: 14, data: trajectory?.final ? [point(trajectory.final)] : [], itemStyle: { color: "#35c28f" } },
    ],
  }), [trajectory]);
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError || !query.data || !trajectory) return <div className="standard-page"><OperationalError error={query.error ?? new Error("Trajectory unavailable")} onRetry={() => void query.refetch()} /></div>;
  return <div className="standard-page operational-page trajectory-page">
    <PageHeader title={`Trajectory · ${repetitionId}`} subtitle="交互视图最多 2000 点；arrival、freshness、dwell 与 speed 均以 sourceObservedAt 为时间依据。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    {trajectory.samples.some((sample) => sample.sourceObservedAt === null) && <Alert type="error" showIcon message="SOURCE_OBSERVED_AT_MISSING" description="缺失观测不会通过 receivedAt 插值为到达证明。" />}
    {trajectory.gaps.length > 0 && <Alert type="warning" showIcon message="Unknown trajectory gaps" description={`${trajectory.gaps.length} gap(s) remain explicit and are not interpolated.`} />}
    <div className="operational-two-column">
      <SectionCard title={`Path · ${trajectory.coordinateFrame}`}><ReactECharts option={option} style={{ height: 430 }} /></SectionCard>
      <SectionCard title="Physical proof summary"><Descriptions bordered column={1} items={[
        { key: "start", label: "Start", children: trajectory.start ? JSON.stringify(trajectory.start) : "unavailable" },
        { key: "target", label: "Target", children: trajectory.target ? JSON.stringify(trajectory.target) : "unavailable" },
        { key: "final", label: "Final", children: trajectory.final ? JSON.stringify(trajectory.final) : "unavailable" },
        { key: "tolerance", label: "Tolerance", children: trajectory.toleranceM == null ? "unavailable" : `${trajectory.toleranceM} m` },
        { key: "samples", label: "Interactive samples", children: trajectory.samples.length },
        { key: "downsampled", label: "Downsampled", children: String(trajectory.downsampled) },
        { key: "artifact", label: "Full artifact", children: trajectory.fullArtifactRef ?? "not available" },
        { key: "gaps", label: "Unknown gaps", children: trajectory.gaps.length },
      ]} /></SectionCard>
    </div>
    <SectionCard title="Position / speed / mission samples"><Table<TrajectorySampleView> rowKey="sequence" pagination={{ pageSize: 20 }} dataSource={trajectory.samples} columns={[
      { title: "#", dataIndex: "sequence" }, { title: "Position", dataIndex: "position", render: (value: Record<string, unknown>) => JSON.stringify(value) },
      { title: "Speed", dataIndex: "speedMps", render: (value: number | null) => value == null ? "—" : `${value.toFixed(2)} m/s` }, { title: "Mission", dataIndex: "missionState", render: (value: string | null) => value ? <Tag>{value}</Tag> : "—" },
      { title: "Source observed", dataIndex: "sourceObservedAt", render: compactTimestamp }, { title: "Received", dataIndex: "receivedAt", render: compactTimestamp }, { title: "Accuracy", dataIndex: "accuracyM", render: (value: number | null) => value == null ? "—" : `${value} m` },
    ]} /></SectionCard>
  </div>;
}

function point(value: Record<string, unknown>) {
  const x = typeof value.x === "number" ? value.x : typeof value.longitude === "number" ? value.longitude : 0;
  const y = typeof value.y === "number" ? value.y : typeof value.latitude === "number" ? value.latitude : 0;
  return [x, y];
}
