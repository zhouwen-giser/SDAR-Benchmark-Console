"use client";

import type { CSSProperties, MouseEvent } from "react";

type Props = {
  option?: Record<string, any>;
  style?: CSSProperties;
  onEvents?: { click?: (params: Record<string, any>) => void };
  [key: string]: unknown;
};

const palette = ["#3b82f6", "#28c76f", "#ef5261", "#f5b942", "#26a6b7", "#8b6bd6"];

function valuesOf(series: any[]) {
  return series.flatMap((item) => (item.data ?? []).map((point: any) => Number(typeof point === "object" && !Array.isArray(point) ? point.value : point) || 0));
}

function click(handler: Props["onEvents"], params: Record<string, any>) {
  return (event: MouseEvent<SVGElement>) => { event.stopPropagation(); handler?.click?.(params); };
}

function LineChart({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const series = (option.series ?? []).filter((item: any) => item.type === "line");
  const labels: string[] = option.xAxis?.data ?? [];
  const all = valuesOf(series);
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 100);
  return <>{[0, 1, 2, 3].map((line) => <line key={line} x1="38" x2="588" y1={24 + line * 58} y2={24 + line * 58} stroke="#1d3549" />)}{series.map((item: any, seriesIndex: number) => { const points = (item.data ?? []).map((entry: any, index: number) => { const value = Number(typeof entry === "object" ? entry.value : entry) || 0; const x = 42 + index * (540 / Math.max(1, item.data.length - 1)); const y = 224 - ((value - min) / Math.max(1, max - min)) * 190; return { x, y, value, index }; }); return <g key={item.name ?? seriesIndex}><polyline points={points.map((point: any) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={palette[seriesIndex % palette.length]} strokeWidth="2.5" />{points.map((point: any) => <circle key={point.index} cx={point.x} cy={point.y} r="4" fill={palette[seriesIndex % palette.length]} onClick={click(onEvents, { name: labels[point.index], value: point.value, seriesName: item.name, dataIndex: point.index })} />)}</g>; })}<g className="chart-axis-labels">{labels.filter((_, index) => index % Math.max(1, Math.ceil(labels.length / 7)) === 0).map((label, index) => <text key={label} x={42 + index * (540 / Math.max(1, Math.min(6, labels.length - 1)))} y="252">{label}</text>)}</g></>;
}

function Heatmap({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const series = (option.series ?? []).find((item: any) => item.type === "heatmap") ?? {};
  const xLabels: string[] = option.xAxis?.data ?? [];
  const yLabels: string[] = option.yAxis?.data ?? [];
  const cellWidth = 510 / Math.max(1, xLabels.length);
  const cellHeight = 198 / Math.max(1, yLabels.length);
  return <><g>{series.data?.map((point: any, index: number) => { const value = Array.isArray(point) ? point : point.value; const score = Number(value[2]) || 0; const hue = score >= 85 ? "#1e8058" : score >= 70 ? "#9b762d" : "#873743"; const x = 66 + value[0] * cellWidth; const y = 20 + value[1] * cellHeight; return <g key={index} onClick={click(onEvents, { value, name: xLabels[value[0]], data: point })}><rect x={x} y={y} width={Math.max(4, cellWidth - 3)} height={Math.max(4, cellHeight - 3)} rx="2" fill={hue} /><text x={x + cellWidth / 2} y={y + cellHeight / 2 + 3} textAnchor="middle" fill="#f4f8fb" fontSize={xLabels.length > 10 ? 8 : 11}>{score}</text></g>; })}</g><g className="chart-axis-labels">{xLabels.map((label, index) => <text key={label} x={66 + index * cellWidth + cellWidth / 2} y="246" textAnchor="middle">{label}</text>)}{yLabels.map((label, index) => <text key={label} x="58" y={20 + index * cellHeight + cellHeight / 2 + 3} textAnchor="end">{label}</text>)}</g></>;
}

function BarChart({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const item = (option.series ?? []).find((entry: any) => entry.type === "bar") ?? {};
  const horizontal = option.yAxis?.type === "category";
  const labels: string[] = (horizontal ? option.yAxis?.data : option.xAxis?.data) ?? [];
  const data = item.data ?? [];
  const numeric = data.map((entry: any) => Number(typeof entry === "object" ? entry.value : entry) || 0);
  const max = Math.max(...numeric.map(Math.abs), 1);
  return <><g>{data.map((entry: any, index: number) => { const value = numeric[index]; const color = entry?.itemStyle?.color ?? palette[index % palette.length]; if (horizontal) { const h = Math.min(22, 185 / Math.max(1, data.length)); const y = 24 + index * (200 / Math.max(1, data.length)); return <g key={index} onClick={click(onEvents, { name: labels[index], value, dataIndex: index })}><rect x="104" y={y} width={Math.max(2, Math.abs(value) / max * 450)} height={h} rx="4" fill={color} /><text x="96" y={y + h * .72} textAnchor="end" fill="#879aae" fontSize="10">{labels[index]}</text><text x={112 + Math.abs(value) / max * 450} y={y + h * .72} fill="#dce8f2" fontSize="10">{value}</text></g>; } const w = 470 / Math.max(1, data.length); const height = Math.abs(value) / max * 175; const y = value >= 0 ? 212 - height : 212; return <g key={index} onClick={click(onEvents, { name: labels[index], value, data: entry, dataIndex: index })}><rect x={70 + index * w} y={y} width={Math.max(8, w - 12)} height={Math.max(2, height)} rx="3" fill={color} /><text x={70 + index * w + (w - 12) / 2} y="242" textAnchor="middle" fill="#879aae" fontSize="9">{labels[index]}</text><text x={70 + index * w + (w - 12) / 2} y={Math.max(15, y - 5)} textAnchor="middle" fill="#dce8f2" fontSize="10">{value}</text></g>; })}</g></>;
}

function ScatterChart({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const item = (option.series ?? []).find((entry: any) => entry.type === "scatter") ?? {};
  return <>{[0, 1, 2, 3, 4].map((line) => <g key={line}><line x1="45" x2="580" y1={20 + line * 50} y2={20 + line * 50} stroke="#1d3549" /><line y1="20" y2="220" x1={45 + line * 133.75} x2={45 + line * 133.75} stroke="#1d3549" /></g>)}{item.data?.map((entry: any, index: number) => { const value = entry.value ?? entry; const x = 45 + Number(value[0]) / 100 * 535; const y = 220 - Number(value[1]) / 100 * 200; const color = entry.itemStyle?.color ?? palette[index % palette.length]; return <circle key={index} cx={x} cy={y} r={Math.min(13, 5 + Number(value[2] ?? 1))} fill={color} fillOpacity=".84" stroke="#d9e8f6" strokeWidth="1" onClick={click(onEvents, { value, data: entry })} />; })}</>;
}

function FunnelChart({ option }: Required<Pick<Props, "option">>) {
  const data = option.series?.[0]?.data ?? [];
  const max = Math.max(...data.map((entry: any) => Number(entry.value)), 1);
  return <>{data.map((entry: any, index: number) => { const width = 340 * Number(entry.value) / max; const y = 18 + index * 37; return <g key={entry.name ?? index}><path d={`M ${38 + (340 - width) / 2} ${y} H ${38 + (340 + width) / 2} L ${38 + (340 + width * .88) / 2} ${y + 31} H ${38 + (340 - width * .88) / 2} Z`} fill={palette[(index + 1) % palette.length]} fillOpacity=".72" /><text x="208" y={y + 20} textAnchor="middle" fill="#f4f8fb" fontSize="10">{entry.value} {entry.name}</text></g>; })}</>;
}

function PieChart({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const data = option.series?.[0]?.data ?? [];
  const total = data.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0) || 1;
  const title = Array.isArray(option.title) ? option.title[0] : option.title;
  let offset = 0;
  return <><g transform="rotate(-90 170 130)">{data.map((entry: any, index: number) => { const length = Number(entry.value) / total * 301.6; const circle = <circle key={entry.name ?? index} cx="170" cy="130" r="48" fill="none" stroke={palette[index % palette.length]} strokeWidth="28" strokeDasharray={`${length} ${301.6 - length}`} strokeDashoffset={-offset} onClick={click(onEvents, { name: entry.name, value: entry.value, data: entry, dataIndex: index })} />; offset += length; return circle; })}</g><text x="170" y="128" textAnchor="middle" fill="#dce8f2" fontSize="15" fontWeight="700">{title?.text ?? `${total}%`}</text><text x="170" y="145" textAnchor="middle" fill="#879aae" fontSize="9">{title?.subtext ?? "贡献占比"}</text>{data.map((entry: any, index: number) => <g key={entry.name} transform={`translate(300 ${45 + index * 28})`}><rect width="8" height="8" rx="2" fill={palette[index % palette.length]} /><text x="15" y="8" fill="#a9bac9" fontSize="10">{entry.name} · {entry.value}%</text></g>)}</>;
}

function GraphChart({ option, onEvents }: Required<Pick<Props, "option">> & Pick<Props, "onEvents">) {
  const series = option.series?.[0] ?? {};
  const nodes = series.data ?? [];
  const nodeMap = new Map(nodes.map((node: any) => [node.id, node]));
  const scale = (node: any) => ({ x: 50 + (Number(node.x) || 0) / 760 * 510, y: 28 + (Number(node.y) || 0) / 330 * 205 });
  return <>{series.links?.map((edge: any, index: number) => { const source = nodeMap.get(edge.source); const target = nodeMap.get(edge.target); if (!source || !target) return null; const a = scale(source); const b = scale(target); return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#42688a" strokeWidth="2" />; })}{nodes.map((node: any) => { const point = scale(node); const missing = String(node.name).includes("MISSING"); return <g key={node.id} onClick={click(onEvents, { dataType: "node", data: node, name: node.name })}><circle cx={point.x} cy={point.y} r={Math.max(18, Number(node.symbolSize ?? 42) / 2)} fill={node.itemStyle?.color ?? "#123d67"} stroke={node.itemStyle?.borderColor ?? "#3b82f6"} strokeWidth={missing ? 3 : 1.5} strokeDasharray={missing ? "5 4" : undefined} /><text x={point.x} y={point.y + 3} textAnchor="middle" fill="#f4f8fb" fontSize="8">{String(node.name).split("\n")[0]}</text></g>; })}</>;
}

function BoxPlot({ option }: Required<Pick<Props, "option">>) {
  const values = option.series?.[0]?.data?.[0] ?? [20, 40, 55, 75, 90];
  const x = (value: number) => 55 + value / 100 * 510;
  return <><line x1={x(values[0])} x2={x(values[4])} y1="130" y2="130" stroke="#76a9ff" strokeWidth="2" /><rect x={x(values[1])} y="95" width={Math.max(3, x(values[3]) - x(values[1]))} height="70" fill="#244f7b" stroke="#76a9ff" strokeWidth="2" /><line x1={x(values[2])} x2={x(values[2])} y1="95" y2="165" stroke="#f5f8fb" strokeWidth="3" />{values.map((value: number) => <text key={value} x={x(value)} y="188" textAnchor="middle" fill="#9eb0c0" fontSize="10">{value}</text>)}</>;
}

export default function ReactECharts({ option = {}, style, onEvents }: Props) {
  const series = option.series ?? [];
  const types = new Set(series.map((item: any) => item.type));
  let content = <g><text x="300" y="130" textAnchor="middle" fill="#879aae">No formal chart data</text></g>;
  if (types.has("graph")) content = <GraphChart option={option} onEvents={onEvents} />;
  else if (types.has("heatmap")) content = <Heatmap option={option} onEvents={onEvents} />;
  else if (types.has("line")) content = <LineChart option={option} onEvents={onEvents} />;
  else if (types.has("scatter")) content = <ScatterChart option={option} onEvents={onEvents} />;
  else if (types.has("funnel")) content = <FunnelChart option={option} />;
  else if (types.has("pie")) content = <PieChart option={option} onEvents={onEvents} />;
  else if (types.has("boxplot")) content = <BoxPlot option={option} />;
  else if (types.has("bar")) content = <BarChart option={option} onEvents={onEvents} />;
  return <div className="echarts-preview" style={style}><svg viewBox="0 0 600 260" preserveAspectRatio={types.has("pie") ? "xMidYMid meet" : "none"} role="img" aria-label="数据可视化图表"><rect width="600" height="260" fill="transparent" />{content}</svg></div>;
}
