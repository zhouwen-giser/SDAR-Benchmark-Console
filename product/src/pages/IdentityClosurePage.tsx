import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Table, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useParams } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag } from "../operational/components";
import type { IdentityEdgeView } from "../operational/types";

export function IdentityClosurePage() {
  const { runId = "", repetitionId } = useParams();
  const query = useQuery({ queryKey: ["operational", "identity", runId, repetitionId], queryFn: () => repetitionId ? operationalApi.getRepetitionIdentityClosure(runId, repetitionId) : operationalApi.getRunIdentityClosure(runId), enabled: Boolean(runId) });
  const closure = query.data?.data;
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { formatter: "{b}" },
    series: [{ type: "graph", layout: "force", roam: true, force: { repulsion: 230, edgeLength: 140 }, label: { show: true, color: "#dbe7f2", formatter: "{b}", fontSize: 10 }, edgeLabel: { show: true, color: "#8fa7ba", formatter: (params: unknown) => (params as { data?: { name?: string } }).data?.name ?? "" }, data: (closure?.nodes ?? []).map((node) => ({ id: node.nodeId, name: `${node.kind}\n${node.identity}`, value: node.authority, symbolSize: 50, itemStyle: { color: "#1677ff" } })), links: (closure?.edges ?? []).map((edge) => ({ source: edge.from, target: edge.to, name: edge.kind, lineStyle: { color: edge.status === "exact" ? "#35c28f" : edge.status === "conflict" ? "#ff5b69" : "#d09b47", type: edge.status === "exact" ? "solid" : "dashed" } })), emphasis: { focus: "adjacency" } }],
  }), [closure]);
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError || !query.data || !closure) return <div className="standard-page"><OperationalError error={query.error ?? new Error("Identity closure unavailable")} onRetry={() => void query.refetch()} /></div>;
  return <div className="standard-page operational-page identity-page">
    <PageHeader title={`Identity Closure · ${repetitionId ?? runId}`} subtitle="每条边严格使用显式 authoritative identifier 与 0/1/many 语义；不使用 latest/time-nearest/name fallback。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <div className="operational-kpi-grid">
      <SectionCard><span>Overall</span><strong><OperationalStatusTag value={closure.overallStatus} /></strong><small>{closure.scope}</small></SectionCard>
      <SectionCard><span>Nodes</span><strong>{closure.nodes.length}</strong><small>authoritative identities</small></SectionCard>
      <SectionCard><span>Exact edges</span><strong>{closure.edges.filter((edge) => edge.status === "exact").length}</strong><small>matchCount = 1</small></SectionCard>
      <SectionCard><span>Unresolved / conflict</span><strong>{closure.edges.filter((edge) => edge.status === "unresolved" || edge.status === "conflict").length}</strong><small>attention candidates</small></SectionCard>
    </div>
    <SectionCard title="Exact identity graph" className="identity-graph-card"><ReactECharts option={option} style={{ height: 460 }} /></SectionCard>
    <SectionCard title="Identity edges"><Table<IdentityEdgeView> rowKey="edgeId" pagination={false} dataSource={closure.edges} scroll={{ x: 1200 }} columns={[
      { title: "Edge", dataIndex: "kind" }, { title: "From", dataIndex: "from" }, { title: "To", dataIndex: "to" },
      { title: "Status", dataIndex: "status", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Match count", dataIndex: "matchCount" }, { title: "Authority", dataIndex: "authority" },
      { title: "Source refs", dataIndex: "sourceRefs", render: (values: string[]) => values.map((value) => <Tag key={value}>{value}</Tag>) }, { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => values.join(" · ") || "—" },
    ]} /></SectionCard>
  </div>;
}
