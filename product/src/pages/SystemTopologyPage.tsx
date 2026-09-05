import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Space, Table, Tag, message } from "antd";
import { ApiOutlined, ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { EmptyOperational, NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, SourceIdentity, compactTimestamp } from "../operational/components";
import type { SystemComponentView } from "../operational/types";

export function SystemTopologyPage() {
  const query = useQuery({ queryKey: ["operational", "topology"], queryFn: () => operationalApi.getSystemTopology() });
  const compatibility = useQuery({ queryKey: ["operational", "compatibility"], queryFn: () => operationalApi.getSystemCompatibility() });
  const [selected, setSelected] = useState<SystemComponentView | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const probe = useMutation({
    mutationFn: (componentId: string) => operationalApi.probeSystemComponent(componentId),
    onSuccess: (resource) => { setSelected(resource.data); messageApi.success("只读 component probe 已完成"); void query.refetch(); },
    onError: (error) => messageApi.error(error instanceof Error ? error.message : "Component probe 失败"),
  });
  const resource = query.data;
  const topology = resource?.data;
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { formatter: (params: unknown) => topologyTooltip(params) },
    series: [{
      type: "graph",
      layout: "force",
      roam: true,
      force: { repulsion: 260, edgeLength: 130 },
      label: { show: true, color: "#d8e7f3", fontSize: 11 },
      data: (topology?.nodes ?? []).map((node) => ({ id: node.componentId, name: node.displayName, value: node.readiness, symbolSize: node.componentType.includes("benchmark") ? 62 : 48, itemStyle: { color: node.readiness === "ready" ? "#16a085" : node.readiness === "partial" ? "#c98b2e" : "#8d99a6" } })),
      links: (topology?.edges ?? []).map((edge) => ({ source: edge.from, target: edge.to, name: edge.protocol, lineStyle: { color: edge.status === "ready" ? "#3cb8ff" : "#d09b47", type: edge.status === "ready" ? "solid" : "dashed" } })),
      edgeLabel: { show: true, formatter: (params: unknown) => (params as { data?: { name?: string } }).data?.name ?? "", color: "#8aa4b8", fontSize: 9 },
      emphasis: { focus: "adjacency" },
    }],
  }), [topology]);

  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError) return <div className="standard-page"><OperationalError error={query.error} onRetry={() => void query.refetch()} /></div>;
  if (!resource || !topology) return <div className="standard-page"><EmptyOperational description="Topology response is empty" /></div>;

  return (
    <div className="standard-page operational-page topology-page">
      {contextHolder}
      <PageHeader title="System Topology" subtitle="组件、合同与数据/控制边的版本化视图；Probe 只读取 health、readiness、version、contract、watermark 与 latency。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新快照</Button>} />
      <OperationalMetaStrip meta={resource.meta} />
      <NativeBoundaryNotice dataClass={resource.meta.dataClass} />
      <div className="operational-kpi-grid">
        <SectionCard><span>Topology revision</span><strong>{topology.topologyRevision}</strong><small>{compactTimestamp(topology.generatedAt)}</small></SectionCard>
        <SectionCard><span>Components</span><strong>{topology.nodes.length}</strong><small>versioned registry nodes</small></SectionCard>
        <SectionCard><span>Edges</span><strong>{topology.edges.length}</strong><small>control and data flow</small></SectionCard>
        <SectionCard className={topology.nativeExecutionReady ? "operational-kpi-ready" : "operational-kpi-warning"}><span>Native execution</span><strong>{topology.nativeExecutionReady ? "READY" : "NOT READY"}</strong><small>{topology.reasonCodes.join(" · ") || "all required contracts exact"}</small></SectionCard>
      </div>
      <div className="operational-two-column">
        <SectionCard title="Live topology graph" className="topology-graph-card"><ReactECharts option={option} style={{ height: 420 }} onEvents={{ click: (params: { data?: { id?: string } }) => { const node = topology.nodes.find((item) => item.componentId === params.data?.id); if (node) setSelected(node); } }} /></SectionCard>
        <SectionCard title="Registered components">
          <Table<SystemComponentView> rowKey="componentId" size="small" pagination={false} dataSource={topology.nodes} columns={[
            { title: "Component", dataIndex: "displayName", render: (value: string, row) => <button className="link-button" onClick={() => setSelected(row)}>{value}</button> },
            { title: "Type", dataIndex: "componentType" },
            { title: "Health", dataIndex: "health", render: (value: string) => <OperationalStatusTag value={value} /> },
            { title: "Readiness", dataIndex: "readiness", render: (value: string) => <OperationalStatusTag value={value} /> },
            { title: "Latency", dataIndex: "latencyMs", render: (value: number | null) => value == null ? "—" : `${value} ms` },
          ]} />
        </SectionCard>
      </div>
      <SectionCard title="Producer / consumer compatibility" extra={compatibility.data && <OperationalStatusTag value={compatibility.data.meta.availability} />}>
        {compatibility.isError ? <OperationalError error={compatibility.error} onRetry={() => void compatibility.refetch()} /> : <Table rowKey={(row) => `${row.producer}-${row.consumer}-${row.contract}`} loading={compatibility.isLoading} pagination={false} dataSource={compatibility.data?.data.relations ?? []} columns={[
          { title: "Producer", dataIndex: "producer" }, { title: "Consumer", dataIndex: "consumer" }, { title: "Contract", dataIndex: "contract" },
          { title: "Expected", dataIndex: "expectedVersion", render: (value: string | null) => value ?? "—" }, { title: "Observed", dataIndex: "observedVersion", render: (value: string | null) => value ?? "—" },
          { title: "Status", dataIndex: "status", render: (value: string) => <OperationalStatusTag value={value} /> },
          { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => values.length ? values.map((value) => <Tag key={value}>{value}</Tag>) : "—" },
        ]} />}
      </SectionCard>
      <Drawer width={760} open={selected !== null} onClose={() => setSelected(null)} title={selected ? `Component · ${selected.displayName}` : "Component"} extra={selected && <Button icon={<ApiOutlined />} loading={probe.isPending} onClick={() => probe.mutate(selected.componentId)}>只读 Probe</Button>}>
        {selected && <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <SourceIdentity values={[
            { label: "Component ID", value: selected.componentId }, { label: "Type", value: selected.componentType }, { label: "Health", value: <OperationalStatusTag value={selected.health} /> },
            { label: "Readiness", value: <OperationalStatusTag value={selected.readiness} /> }, { label: "Repository", value: selected.repository ?? "unresolved" }, { label: "Branch", value: selected.branch ?? "unresolved" },
            { label: "Commit", value: selected.commit ?? "unresolved" }, { label: "Version", value: selected.version ?? "unresolved" }, { label: "Image digest", value: selected.imageDigest ?? "not applicable / unresolved" },
            { label: "Endpoint", value: selected.endpoint ?? "unavailable" }, { label: "Last seen", value: compactTimestamp(selected.lastSeenAt) }, { label: "Latency", value: selected.latencyMs == null ? "—" : `${selected.latencyMs} ms` },
          ]} />
          <Descriptions title="Contracts and capabilities" bordered column={1} items={[
            { key: "contracts", label: "Contracts", children: selected.contracts.map((value) => <Tag key={value}>{value}</Tag>) },
            { key: "capabilities", label: "Capabilities", children: selected.capabilities.map((value) => <Tag color="blue" key={value}>{value}</Tag>) },
            { key: "reasons", label: "Reason codes", children: (selected.reasonCodes ?? []).length ? selected.reasonCodes!.join(" · ") : "—" },
          ]} />
        </Space>}
      </Drawer>
    </div>
  );
}

function topologyTooltip(params: unknown) {
  if (!params || typeof params !== "object") return "";
  const value = params as { dataType?: string; data?: { name?: string; value?: string } };
  return value.dataType === "edge" ? value.data?.value ?? "" : `${value.data?.name ?? "Component"}<br/>${value.data?.value ?? ""}`;
}
