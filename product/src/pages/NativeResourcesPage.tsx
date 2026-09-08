import { useQuery } from "@tanstack/react-query";
import { Button, Table, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { EmptyOperational, NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, compactTimestamp } from "../operational/components";
import type { NativeResourceView } from "../operational/types";

export function NativeResourcesPage() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["operational", "resources"], queryFn: () => operationalApi.listResources() });
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError) return <div className="standard-page"><OperationalError error={query.error} onRetry={() => void query.refetch()} /></div>;
  if (!query.data) return <div className="standard-page"><EmptyOperational description="Resource registry is empty" /></div>;
  const rows = query.data.data;
  return <div className="standard-page operational-page resources-page">
    <PageHeader title="Resources" subtitle="Environment-scoped UGV identity、Provider binding、四时间域、mission 与 Benchmark history。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <div className="operational-kpi-grid">
      <SectionCard><span>Resources</span><strong>{rows.length}</strong><small>registered identities</small></SectionCard>
      <SectionCard><span>Available</span><strong>{rows.filter((item) => item.availability === "available").length}</strong><small>point-in-time observation</small></SectionCard>
      <SectionCard><span>Active mission</span><strong>{rows.filter((item) => item.activeMissionId !== null).length}</strong><small>physical side effects</small></SectionCard>
      <SectionCard><span>Stale / unknown</span><strong>{rows.filter((item) => item.availability === "stale" || item.availability === "unknown").length}</strong><small>never promoted to available</small></SectionCard>
    </div>
    <SectionCard title="Resource registry and live status"><Table<NativeResourceView> rowKey="resourceId" pagination={false} dataSource={rows} scroll={{ x: 1500 }} columns={[
      { title: "Resource", dataIndex: "resourceId", fixed: "left", render: (value: string) => <button className="link-button" onClick={() => navigate(`/resources/${encodeURIComponent(value)}`)}>{value}</button> },
      { title: "Environment", dataIndex: "environmentId", render: (value: string) => <button className="link-button" onClick={() => navigate(`/environments/${encodeURIComponent(value)}`)}>{value}</button> },
      { title: "Availability", dataIndex: "availability", render: (value: string) => <OperationalStatusTag value={value} /> },
      { title: "Provider", dataIndex: "providerId", render: (value: string | null) => value ?? "—" }, { title: "Provider instance", dataIndex: "providerInstanceId", render: (value: string | null) => value ?? "—" },
      { title: "Speed", dataIndex: "speedMps", render: (value: number | null) => value == null ? "—" : `${value.toFixed(2)} m/s` },
      { title: "Source observed", dataIndex: ["observationTimes", "sourceObservedAt"], render: compactTimestamp },
      { title: "Mission", dataIndex: "activeMissionId", render: (value: string | null) => value ?? "—" },
      { title: "Capabilities", dataIndex: "capabilities", render: (values: string[]) => values.map((value) => <Tag key={value} color="blue">{value}</Tag>) },
    ]} /></SectionCard>
  </div>;
}
