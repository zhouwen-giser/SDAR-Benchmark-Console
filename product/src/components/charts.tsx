import type { CSSProperties } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { chartPalette } from "../theme/theme";
import type { EvidenceDetail, OverviewSnapshot } from "../types";

const axisStyle = {
  axisLine: { lineStyle: { color: "#294159" } },
  axisLabel: { color: chartPalette.muted, fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(42,67,90,.42)" } },
};

function Chart({
  option,
  style,
  onClick,
}: {
  option: EChartsOption;
  style?: CSSProperties;
  onClick?: (params: Record<string, unknown>) => void;
}) {
  return (
    <ReactECharts
      option={{
        backgroundColor: "transparent",
        animationDuration: 350,
        textStyle: { color: chartPalette.text, fontFamily: "Inter, Noto Sans SC, system-ui" },
        aria: { enabled: true },
        ...option,
      }}
      notMerge
      lazyUpdate
      opts={{ renderer: "canvas" }}
      style={{ width: "100%", height: "100%", minHeight: 120, ...style }}
      onEvents={onClick ? { click: onClick } : undefined}
    />
  );
}

export function QualityTrendChart({
  data,
  onPoint,
}: {
  data: OverviewSnapshot["qualityTrend"];
  onPoint?: (label: string) => void;
}) {
  const labels = data.map((item) => item.label);
  const option: EChartsOption = {
    color: [chartPalette.blue, chartPalette.positive, chartPalette.danger, chartPalette.warning],
    grid: { left: 34, right: 12, top: 32, bottom: 22 },
    legend: {
      top: 0,
      left: 2,
      textStyle: { color: chartPalette.muted, fontSize: 9 },
      itemWidth: 8,
      itemHeight: 6,
    },
    tooltip: { trigger: "axis", valueFormatter: (value: unknown) => (value == null ? "—" : `${String(value)}%`) },
    xAxis: { type: "category", data: labels, boundaryGap: false, ...axisStyle },
    yAxis: { type: "value", min: 40, max: 100, ...axisStyle },
    series: [
      {
        name: "Mean Score",
        type: "line",
        data: data.map((item) => item.meanScore),
        smooth: 0.28,
        symbolSize: 6,
      },
      {
        name: "Pass Rate",
        type: "line",
        data: data.map((item) => item.passRate),
        smooth: 0.28,
        symbolSize: 5,
      },
      {
        name: "Critical Pass",
        type: "line",
        data: data.map((item) => item.criticalRiskPassRate),
        smooth: 0.28,
        symbolSize: 5,
      },
      {
        name: "P10",
        type: "line",
        data: data.map((item) => item.p10),
        smooth: 0.28,
        symbol: "none",
        lineStyle: { type: "dashed", width: 1 },
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        const name = params.name;
        if (onPoint && typeof name === "string") onPoint(name);
      }}
    />
  );
}

export function RegressionWaterfallChart({
  data,
  onBar,
}: {
  data: NonNullable<OverviewSnapshot["regressionWaterfall"]>;
  onBar?: (change: string) => void;
}) {
  const labels = ["Baseline", "Recovered", "Improved", "Regressed", "New HG", "Not Ready", "Current"];
  const values = [data.baseline, data.recovered, data.improved, data.regressed, data.newHg, data.notReady, data.candidate];
  const colors = [
    chartPalette.blue,
    chartPalette.positive,
    chartPalette.positive,
    chartPalette.danger,
    chartPalette.orange,
    chartPalette.notReady,
    "#2c78d1",
  ];
  const option: EChartsOption = {
    grid: { left: 12, right: 8, top: 24, bottom: 38 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: chartPalette.muted, fontSize: 8, interval: 0, rotate: 20 },
      axisLine: { lineStyle: { color: "#294159" } },
      axisTick: { show: false },
    },
    yAxis: { type: "value", axisLabel: { show: false }, splitLine: { show: false } },
    series: [
      {
        type: "bar",
        barMaxWidth: 28,
        data: values.map((value, index) => ({
          value,
          itemStyle: { color: colors[index], borderRadius: [2, 2, 0, 0] },
          label: {
            show: true,
            position: value >= 0 ? "top" : "bottom",
            color: index === 3 || index === 4 ? chartPalette.danger : chartPalette.text,
            fontSize: 9,
            formatter: index === 0 || index === 6 ? `${value.toFixed(1)}` : `${value > 0 ? "+" : ""}${value}`,
          },
        })),
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        const name = params.name;
        if (onBar && typeof name === "string") onBar(name);
      }}
    />
  );
}

export function TrackRiskHeatmap({
  data,
  onCell,
}: {
  data: OverviewSnapshot["trackRiskMatrix"];
  onCell?: (track: string, risk: string) => void;
}) {
  const tracks = ["core", "skill", "mcp", "node", "cross"];
  const risks = ["critical", "high", "medium", "low"];
  const points = data.map((item) => [tracks.indexOf(item.track), risks.indexOf(item.risk), item.passRate ?? 0]);
  const option: EChartsOption = {
    grid: { left: 48, right: 8, top: 24, bottom: 26 },
    tooltip: {
      position: "top",
      formatter: (params: unknown) => {
        const value = (params as { value: [number, number, number] }).value;
        return `${risks[value[1]]} × ${tracks[value[0]]}<br/><b>${value[2]}%</b>`;
      },
    },
    xAxis: { type: "category", data: tracks, splitArea: { show: true }, ...axisStyle },
    yAxis: { type: "category", data: risks, splitArea: { show: true }, ...axisStyle },
    visualMap: {
      min: 60,
      max: 100,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      show: false,
      inRange: { color: ["#8d2b32", "#a86d25", "#328551", "#1f9a5d"] },
    },
    series: [
      {
        type: "heatmap",
        data: points,
        label: { show: true, color: "#f5f8fb", fontSize: 10, formatter: (p: unknown) => `${(p as { value: number[] }).value[2]}` },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(59,130,246,.75)" } },
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        const value = params.value;
        if (onCell && Array.isArray(value)) onCell(tracks[Number(value[0])], risks[Number(value[1])]);
      }}
    />
  );
}

export function MetricHeatmap({
  data,
  onCell,
}: {
  data: OverviewSnapshot["metricHeatmap"];
  onCell?: (metric: string, track: string) => void;
}) {
  const metrics = Array.from({ length: 15 }, (_, index) => `M${index + 1}`);
  const tracks = ["Core", "Skill", "MCP", "Node", "Cross"];
  const points: Array<[number, number, number]> = data.map((item) => [
    metrics.indexOf(item.metric),
    tracks.indexOf(item.track),
    item.score,
  ]);
  const option: EChartsOption = {
    grid: { left: 50, right: 8, top: 12, bottom: 28 },
    tooltip: {
      formatter: (params: unknown) => {
        const value = (params as { value: [number, number, number] }).value;
        const item = data.find(
          (entry) => entry.metric === metrics[value[0]] && entry.track === tracks[value[1]],
        );
        if (!item) return `${metrics[value[0]]} · ${tracks[value[1]]}<br/><b>${value[2]}</b> / 100`;
        return `${item.track} · ${item.metric}<br/><b>${item.score}</b> / 100<br/>Formal ${item.formalCount} · Diagnostic ${item.diagnosticCount}<br/>Δ ${item.delta}`;
      },
    },
    xAxis: { type: "category", data: metrics, axisLabel: { color: chartPalette.muted, fontSize: 8 }, axisLine: { lineStyle: { color: "#294159" } } },
    yAxis: { type: "category", data: tracks, axisLabel: { color: chartPalette.muted, fontSize: 9 }, axisLine: { lineStyle: { color: "#294159" } } },
    visualMap: {
      min: 40,
      max: 100,
      show: false,
      inRange: { color: ["#85333c", "#b5832c", "#257b53", "#18849c", "#2776ba"] },
    },
    series: [
      {
        type: "heatmap",
        data: points,
        label: { show: true, color: "#f4f8fb", fontSize: 8, formatter: (p: unknown) => `${(p as { value: number[] }).value[2]}` },
        itemStyle: { borderColor: "#0b1824", borderWidth: 2 },
        emphasis: { itemStyle: { borderColor: chartPalette.blue, borderWidth: 2 } },
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        const value = params.value;
        if (onCell && Array.isArray(value)) onCell(metrics[Number(value[0])], tracks[Number(value[1])]);
      }}
    />
  );
}

export function EvidenceFunnelChart({ data }: { data: OverviewSnapshot["evidenceReadinessFunnel"] }) {
  const points: Array<[string, number]> = [
    ["Case Repetitions", data.caseRepetitions],
    ["Episode Resolved", data.episodeResolved],
    ["Manifest Sealed", data.manifestSealed],
    ["Bundle Complete", data.bundleComplete],
    ["Evaluation Ready", data.evaluationReady],
    ["Formal Evaluation", data.formalEvaluation],
  ];
  const option: EChartsOption = {
    color: ["#315a74", "#2b7365", "#26835e", "#278d58", "#3a9255", "#759847"],
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [
      {
        name: "Evidence Readiness",
        type: "funnel",
        left: "2%",
        top: 4,
        bottom: 2,
        width: "62%",
        minSize: "38%",
        maxSize: "100%",
        sort: "descending",
        gap: 2,
        label: { show: true, position: "inside", color: chartPalette.text, fontSize: 9, formatter: "{c} {b}" },
        labelLine: { show: false },
        itemStyle: { borderColor: "#0b1824", borderWidth: 1 },
        data: points.map(([name, value]) => ({ name, value })),
      },
    ],
    graphic: [
      {
        type: "text",
        right: 4,
        top: 14,
        style: {
          text: Object.entries(data.lossReasons)
            .map(([key, value]) => `${key}  ${value}`)
            .join("\n\n"),
          fill: chartPalette.muted,
          fontSize: 9,
          lineHeight: 13,
        },
      },
    ],
  };
  return <Chart option={option} />;
}

export function QualityStabilityChart({
  data,
  onPoint,
}: {
  data: OverviewSnapshot["qualityStabilityPoints"];
  onPoint?: (caseId: string) => void;
}) {
  const riskColor: Record<string, string> = {
    critical: chartPalette.danger,
    high: chartPalette.orange,
    medium: chartPalette.warning,
    low: chartPalette.positive,
  };
  const option: EChartsOption = {
    grid: { left: 38, right: 14, top: 12, bottom: 30 },
    tooltip: {
      formatter: (params: unknown) => {
        const value = (params as { value: [number, number, number, string, string] }).value;
        return `${value[3]}<br/>Score ${value[0]} · Stability ${value[1]}%<br/>${value[4]} · ${value[2]} repetitions`;
      },
    },
    xAxis: { type: "value", min: 0, max: 100, name: "Quality", nameTextStyle: { color: chartPalette.muted, fontSize: 9 }, ...axisStyle },
    yAxis: { type: "value", min: 0, max: 100, name: "Stability", nameTextStyle: { color: chartPalette.muted, fontSize: 9 }, ...axisStyle },
    series: [
      {
        type: "scatter",
        symbolSize: (value: unknown) => 8 + Number((value as number[])[2]) * 2,
        data: data.map((item) => ({
          value: [item.averageScore, item.passStability, item.repetitions, item.caseId, item.risk],
          itemStyle: { color: riskColor[item.risk] },
        })),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#35516a", type: "dashed" },
          data: [{ xAxis: 70 }, { yAxis: 70 }],
        },
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        const value = params.value;
        if (onPoint && Array.isArray(value)) onPoint(String(value[3]));
      }}
    />
  );
}

export function ContributorsChart({
  data,
  onSlice,
}: {
  data: OverviewSnapshot["regressionContributors"];
  onSlice?: (label: string) => void;
}) {
  const option: EChartsOption = {
    color: [chartPalette.danger, chartPalette.orange, chartPalette.warning, "#25a7a5", chartPalette.blue, "#59718b"],
    tooltip: { trigger: "item", formatter: "{b}<br/><b>{c}%</b> ({d}%)" },
    legend: { type: "scroll", orient: "vertical", right: 0, top: 4, bottom: 4, width: "52%", textStyle: { color: chartPalette.muted, fontSize: 8 }, itemWidth: 7, itemHeight: 7 },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        center: ["29%", "50%"],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: "#0b1824", borderWidth: 2 },
        data: data.map((item) => ({ value: item.impactPercent, name: item.label })),
      },
    ],
    graphic: [{ type: "text", left: "23%", top: "44%", style: { text: "80\nCases", align: "center", fill: chartPalette.text, fontSize: 10, lineHeight: 13 } }],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        if (onSlice && typeof params.name === "string") onSlice(params.name);
      }}
    />
  );
}

export function ScoreDistributionChart({ data }: { data: NonNullable<OverviewSnapshot["scoreDistribution"]> }) {
  const option: EChartsOption = {
    grid: { left: 18, right: 12, top: 10, bottom: 26 },
    tooltip: { trigger: "item" },
    xAxis: { type: "value", min: 0, max: 100, ...axisStyle },
    yAxis: { type: "category", data: ["Current"], axisLabel: { show: false }, axisLine: { show: false } },
    series: [
      {
        type: "boxplot",
        data: [[data.p10, data.p25, data.median, data.p75, data.p90]],
        itemStyle: { color: "rgba(59,130,246,.38)", borderColor: "#76a9ff", borderWidth: 2 },
        boxWidth: [24, 42],
      },
    ],
  };
  return <Chart option={option} />;
}

export function SummaryBars({ data }: { data: Array<{ label: string; value: number }> }) {
  const option: EChartsOption = {
    grid: { left: 90, right: 24, top: 4, bottom: 12 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "value", min: 0, max: 100, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: "category", data: data.map((item) => item.label), axisLabel: { color: chartPalette.muted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barWidth: 9,
        showBackground: true,
        backgroundStyle: { color: "#13283a", borderRadius: 6 },
        itemStyle: { color: chartPalette.blue, borderRadius: 6 },
        label: { show: true, position: "right", color: chartPalette.text, fontSize: 10 },
      },
    ],
  };
  return <Chart option={option} />;
}

export function EvidenceGraphChart({ data, onNode }: { data: EvidenceDetail; onNode?: (id: string) => void }) {
  const nodes: Array<{
    id: string;
    name: string;
    symbolSize: number;
    x: number;
    y: number;
    itemStyle: {
      color: string;
      borderColor: string;
      borderWidth: number;
      borderType?: "dashed";
    };
  }> = data.timeline.map((item, index) => ({
    id: item.id,
    name: item.label,
    symbolSize: item.label === "Action" || item.label === "Verification" ? 58 : 42,
    x: 70 + (index % 5) * 150,
    y: 70 + Math.floor(index / 5) * 140,
    itemStyle: {
      color: item.status === "warning" ? "#5c4516" : "#123d67",
      borderColor: item.status === "warning" ? chartPalette.warning : chartPalette.blue,
      borderWidth: 1,
    },
  }));
  nodes.splice(7, 0, {
    id: "receipt-R1",
    name: "Receipt\nMISSING",
    symbolSize: 62,
    x: 500,
    y: 170,
    itemStyle: { color: "#2b1218", borderColor: chartPalette.danger, borderWidth: 2, borderType: "dashed" },
  });
  const links = nodes.slice(1).map((node, index) => ({ source: nodes[index].id, target: node.id }));
  const option: EChartsOption = {
    tooltip: {},
    series: [
      {
        type: "graph",
        layout: "none",
        roam: true,
        data: nodes,
        links,
        label: { show: true, color: chartPalette.text, fontSize: 9 },
        lineStyle: { color: "#42688a", width: 1.5, curveness: 0.06 },
        emphasis: { focus: "adjacency" },
      },
    ],
  };
  return (
    <Chart
      option={option}
      onClick={(params) => {
        if (onNode && params.dataType === "node" && typeof params.data === "object" && params.data) {
          const id = (params.data as { id?: string }).id;
          if (id) onNode(id);
        }
      }}
    />
  );
}
