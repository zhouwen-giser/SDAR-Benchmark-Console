import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Space, Table, Tag, message } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { EmptyOperational, NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, compactTimestamp } from "../operational/components";
import type { EnvironmentView } from "../operational/types";

export function EnvironmentsPage() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["operational", "environments"], queryFn: () => operationalApi.listEnvironments() });
  const [messageApi, contextHolder] = message.useMessage();
  const probe = useMutation({ mutationFn: (id: string) => operationalApi.probeEnvironment(id), onSuccess: () => { messageApi.success("只读 Environment probe 已完成"); void query.refetch(); }, onError: (error) => messageApi.error(error instanceof Error ? error.message : "Probe failed") });
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError) return <div className="standard-page"><OperationalError error={query.error} onRetry={() => void query.refetch()} /></div>;
  if (!query.data) return <div className="standard-page"><EmptyOperational description="Environment registry is empty" /></div>;
  const rows = query.data.data;
  return <div className="standard-page operational-page environments-page">
    {contextHolder}
    <PageHeader title="Environments" subtitle="版本化环境、资源容量、lease、fault profile 与 cleanup 状态；Probe 不 reserve/reset/fault。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <div className="operational-kpi-grid">
      <SectionCard><span>Environments</span><strong>{rows.length}</strong><small>registry versions</small></SectionCard>
      <SectionCard><span>Available</span><strong>{rows.filter((item) => item.leaseStatus === "available").length}</strong><small>point-in-time lease status</small></SectionCard>
      <SectionCard><span>Active missions</span><strong>{rows.reduce((total, item) => total + (item.activeMissionCount ?? 0), 0)}</strong><small>must be zero before deployment</small></SectionCard>
      <SectionCard><span>Quarantine / cleanup</span><strong>{rows.filter((item) => item.leaseStatus === "quarantined" || item.leaseStatus === "cleanup_required").length}</strong><small>explicit operational state</small></SectionCard>
    </div>
    <SectionCard title="Environment registry">
      <Table<EnvironmentView> rowKey="environmentId" pagination={false} dataSource={rows} scroll={{ x: 1300 }} columns={[
        { title: "Environment", dataIndex: "environmentId", render: (value: string) => <button className="link-button" onClick={() => navigate(`/environments/${encodeURIComponent(value)}`)}>{value}</button> },
        { title: "Version", dataIndex: "environmentVersion" }, { title: "Kind", dataIndex: "kind" },
        { title: "Lease", dataIndex: "leaseStatus", render: (value: string) => <OperationalStatusTag value={value} /> },
        { title: "Resources", dataIndex: "resourceCount" }, { title: "Missions", dataIndex: "activeMissionCount" }, { title: "Uncertain tasks", dataIndex: "uncertainTaskCount" },
        { title: "Last probe", dataIndex: "lastProbeAt", render: compactTimestamp },
        { title: "Fault profiles", dataIndex: "supportedFaultProfiles", render: (values: string[]) => values.map((value) => <Tag color="purple" key={value}>{value}</Tag>) },
        { title: "Actions", key: "actions", fixed: "right", render: (_: unknown, row) => <Space><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/environments/${encodeURIComponent(row.environmentId)}`)}>详情</Button><Button size="small" loading={probe.isPending} onClick={() => probe.mutate(row.environmentId)}>Probe</Button></Space> },
      ]} />
    </SectionCard>
  </div>;
}
