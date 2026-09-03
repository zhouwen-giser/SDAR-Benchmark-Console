import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Space, Table, Tag, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, SourceIdentity, compactTimestamp } from "../operational/components";
import type { EnvironmentLeaseView, NativeFaultProfileView, NativeResourceView } from "../operational/types";

export function EnvironmentDetailPage() {
  const { environmentId = "" } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["operational", "environment", environmentId], queryFn: () => operationalApi.getEnvironment(environmentId), enabled: Boolean(environmentId) });
  const resources = useQuery({ queryKey: ["operational", "environment", environmentId, "resources"], queryFn: () => operationalApi.listEnvironmentResources(environmentId), enabled: Boolean(environmentId) });
  const faults = useQuery({ queryKey: ["operational", "environment", environmentId, "faults"], queryFn: () => operationalApi.listEnvironmentFaultProfiles(environmentId), enabled: Boolean(environmentId) });
  const leases = useQuery({ queryKey: ["operational", "environment", environmentId, "leases"], queryFn: () => operationalApi.listEnvironmentLeases(environmentId), enabled: Boolean(environmentId) });
  const [messageApi, contextHolder] = message.useMessage();
  const probe = useMutation({ mutationFn: () => operationalApi.probeEnvironment(environmentId), onSuccess: () => { messageApi.success("只读 Environment probe 已完成"); void query.refetch(); }, onError: (error) => messageApi.error(error instanceof Error ? error.message : "Probe failed") });
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError || !query.data) return <div className="standard-page"><OperationalError error={query.error ?? new Error("Environment unavailable")} onRetry={() => void query.refetch()} /></div>;
  const data = query.data.data;
  return <div className="standard-page operational-page environment-detail-page">
    {contextHolder}
    <PageHeader title={`Environment · ${data.environmentId}`} subtitle="冻结的 source/build identity 与点时 probe、resource、fault、lease、cleanup 事实分开显示。" actions={<><Button onClick={() => navigate("/environments")}>返回</Button><Button type="primary" icon={<ReloadOutlined />} loading={probe.isPending} onClick={() => probe.mutate()}>只读 Probe</Button></>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <SectionCard title="Identity and readiness">
      <SourceIdentity values={[
        { label: "Environment ID", value: data.environmentId }, { label: "Version", value: data.environmentVersion }, { label: "Kind", value: data.kind },
        { label: "Lease status", value: <OperationalStatusTag value={data.leaseStatus} /> }, { label: "Repository", value: data.repositoryRef ?? "unresolved" }, { label: "Build ref", value: data.buildRef ?? "unresolved" },
        { label: "Image digest", value: data.imageDigest ?? "not applicable / unresolved" }, { label: "Control component", value: data.controlEndpointComponentId ?? "unavailable" }, { label: "Referee component", value: data.refereeEndpointComponentId ?? "unavailable" },
        { label: "Active missions", value: data.activeMissionCount }, { label: "Uncertain tasks", value: data.uncertainTaskCount }, { label: "Last probe", value: compactTimestamp(data.lastProbeAt) },
      ]} />
    </SectionCard>
    <div className="operational-two-column">
      <SectionCard title="Resources"><Table<NativeResourceView> rowKey="resourceId" size="small" pagination={false} loading={resources.isLoading} dataSource={resources.data?.data ?? []} columns={[
        { title: "Resource", dataIndex: "resourceId", render: (value: string) => <button className="link-button" onClick={() => navigate(`/resources/${encodeURIComponent(value)}`)}>{value}</button> },
        { title: "Availability", dataIndex: "availability", render: (value: string) => <OperationalStatusTag value={value} /> },
        { title: "Mission", dataIndex: "activeMissionId", render: (value: string | null) => value ?? "—" },
        { title: "Observed", dataIndex: ["observationTimes", "sourceObservedAt"], render: compactTimestamp },
      ]} /></SectionCard>
      <SectionCard title="Native fault profiles"><Table<NativeFaultProfileView> rowKey="faultProfileId" size="small" pagination={false} loading={faults.isLoading} dataSource={faults.data?.data ?? []} columns={[
        { title: "Profile", dataIndex: "faultProfileId" }, { title: "Owner", dataIndex: "owner" },
        { title: "Available", dataIndex: "available", render: (value: boolean) => <OperationalStatusTag value={value ? "available" : "unavailable"} /> },
        { title: "Class", dataIndex: "dataClass", render: (value: string) => <OperationalStatusTag value={value} /> },
      ]} /></SectionCard>
    </div>
    <SectionCard title="Lease and cleanup history"><Table<EnvironmentLeaseView> rowKey="leaseId" pagination={false} loading={leases.isLoading} dataSource={leases.data?.data ?? []} columns={[
      { title: "Lease", dataIndex: "leaseId" }, { title: "Run", dataIndex: "runId", render: (value: string | null) => value ?? "—" },
      { title: "State", dataIndex: "state", render: (value: string) => <OperationalStatusTag value={value} /> },
      { title: "Created", dataIndex: "createdAt", render: compactTimestamp }, { title: "Expires", dataIndex: "expiresAt", render: compactTimestamp },
      { title: "Fence token", dataIndex: "fenceToken", render: (value: string) => <code>{value}</code> },
      { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => values.map((value) => <Tag key={value}>{value}</Tag>) },
    ]} /></SectionCard>
    <SectionCard title="Telemetry and capabilities"><Descriptions bordered column={1} items={[
      { key: "telemetry", label: "Telemetry sources", children: (data.telemetrySourceIds ?? []).map((value) => <Tag key={value}>{value}</Tag>) },
      { key: "capabilities", label: "Native capabilities", children: data.nativeCapabilities.map((value) => <Tag color="cyan" key={value}>{value}</Tag>) },
      { key: "reasons", label: "Reason codes", children: (data.reasonCodes ?? []).join(" · ") || "—" },
    ]} /></SectionCard>
  </div>;
}
