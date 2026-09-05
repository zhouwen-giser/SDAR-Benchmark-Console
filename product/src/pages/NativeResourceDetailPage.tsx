import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Space, Table, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, SourceIdentity, compactTimestamp } from "../operational/components";
import type { MissionHistoryView, NativeCapabilityView, ResourceBenchmarkHistoryView, ResourceObservationView } from "../operational/types";

export function NativeResourceDetailPage() {
  const { resourceId = "" } = useParams();
  const navigate = useNavigate();
  const detail = useQuery({ queryKey: ["operational", "resource", resourceId], queryFn: () => operationalApi.getResource(resourceId), enabled: Boolean(resourceId) });
  const capabilities = useQuery({ queryKey: ["operational", "resource", resourceId, "capabilities"], queryFn: () => operationalApi.getResourceCapabilities(resourceId), enabled: Boolean(resourceId) });
  const observations = useQuery({ queryKey: ["operational", "resource", resourceId, "observations"], queryFn: () => operationalApi.getLatestResourceObservations(resourceId), enabled: Boolean(resourceId) });
  const missions = useQuery({ queryKey: ["operational", "resource", resourceId, "missions"], queryFn: () => operationalApi.listResourceMissions(resourceId), enabled: Boolean(resourceId) });
  const history = useQuery({ queryKey: ["operational", "resource", resourceId, "history"], queryFn: () => operationalApi.listResourceBenchmarkHistory(resourceId), enabled: Boolean(resourceId) });
  if (detail.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (detail.isError || !detail.data) return <div className="standard-page"><OperationalError error={detail.error ?? new Error("Resource unavailable")} onRetry={() => void detail.refetch()} /></div>;
  const data = detail.data.data;
  return <div className="standard-page operational-page resource-detail-page">
    <PageHeader title={`Resource · ${data.resourceId}`} subtitle="Provider、Mission、Benchmark 与 physical observation 的精确身份关联。" actions={<><Button onClick={() => navigate("/resources")}>返回</Button><Button icon={<ReloadOutlined />} onClick={() => void Promise.all([detail.refetch(), observations.refetch(), missions.refetch()])}>刷新</Button></>} />
    <OperationalMetaStrip meta={detail.data.meta} />
    <NativeBoundaryNotice dataClass={detail.data.meta.dataClass} />
    <SectionCard title="Current identity and state"><SourceIdentity values={[
      { label: "Resource ID", value: data.resourceId }, { label: "Type", value: data.resourceType }, { label: "Environment", value: <button className="link-button" onClick={() => navigate(`/environments/${encodeURIComponent(data.environmentId)}`)}>{data.environmentId}</button> },
      { label: "Availability", value: <OperationalStatusTag value={data.availability} /> }, { label: "Provider", value: data.providerId ?? "unresolved" }, { label: "Provider instance", value: data.providerInstanceId ?? "unresolved" },
      { label: "Active mission", value: data.activeMissionId ?? "none" }, { label: "Active MCP Task", value: data.activeMcpTaskId ?? "none" }, { label: "Active Benchmark Run", value: data.activeBenchmarkRunId ?? "none" },
      { label: "Speed", value: data.speedMps == null ? "unavailable" : `${data.speedMps.toFixed(2)} m/s` }, { label: "Accuracy", value: data.positionAccuracyM == null ? "unavailable" : `${data.positionAccuracyM.toFixed(2)} m` }, { label: "Position", value: data.position ? JSON.stringify(data.position) : "unavailable" },
    ]} /></SectionCard>
    <SectionCard title="Four time domains"><Descriptions bordered size="small" column={{ xs: 1, md: 2, xl: 4 }} items={Object.entries(data.observationTimes).map(([key, value]) => ({ key, label: key, children: compactTimestamp(value) }))} /></SectionCard>
    <div className="operational-two-column">
      <SectionCard title="Capabilities"><Table<NativeCapabilityView> rowKey="capabilityId" size="small" pagination={false} loading={capabilities.isLoading} dataSource={capabilities.data?.data ?? []} columns={[
        { title: "Capability", dataIndex: "capabilityId" }, { title: "Operation", dataIndex: "operationName" }, { title: "Native", dataIndex: "native", render: (value: boolean) => String(value) },
        { title: "Availability", dataIndex: "availability", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Source", dataIndex: "sourceRef", render: (value: string | null | undefined) => value ?? "—" },
      ]} /></SectionCard>
      <SectionCard title="Latest physical observations"><Table<ResourceObservationView> rowKey="observationId" size="small" pagination={false} loading={observations.isLoading} dataSource={observations.data?.data ?? []} columns={[
        { title: "Kind", dataIndex: "kind" }, { title: "Mission", dataIndex: "missionId", render: (value: string | null) => value ?? "—" },
        { title: "Source observed", dataIndex: "sourceObservedAt", render: compactTimestamp }, { title: "Received", dataIndex: "receivedAt", render: compactTimestamp }, { title: "Accuracy", dataIndex: "accuracyM", render: (value: number | null) => value == null ? "—" : `${value} m` },
      ]} /></SectionCard>
    </div>
    <SectionCard title="Mission identity history"><Table<MissionHistoryView> rowKey="missionId" pagination={false} loading={missions.isLoading} dataSource={missions.data?.data ?? []} columns={[
      { title: "Mission", dataIndex: "missionId" }, { title: "Provider Execution", dataIndex: "externalExecutionId", render: (value: string | null | undefined) => value ?? "—" }, { title: "Benchmark Run", dataIndex: "benchmarkRunId", render: (value: string | null | undefined) => value ?? "—" },
      { title: "State", dataIndex: "state", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Current", dataIndex: "current", render: (value: boolean) => String(value) }, { title: "Observed", dataIndex: "sourceObservedAt", render: compactTimestamp },
    ]} /></SectionCard>
    <SectionCard title="Benchmark history"><Table<ResourceBenchmarkHistoryView> rowKey="runId" pagination={false} loading={history.isLoading} dataSource={history.data?.data ?? []} columns={[
      { title: "Run", dataIndex: "runId", render: (value: string) => <button className="link-button" onClick={() => navigate(`/runs/${encodeURIComponent(value)}`)}>{value}</button> },
      { title: "Resource", dataIndex: "resourceId" }, { title: "Cases", dataIndex: "caseCount" }, { title: "Terminal", dataIndex: "terminalCount" },
      { title: "Native coverage", dataIndex: "nativeCoverage", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Started", dataIndex: "startedAt", render: compactTimestamp }, { title: "Terminal at", dataIndex: "terminalAt", render: compactTimestamp },
    ]} /></SectionCard>
    {(data.reasonCodes ?? []).length > 0 && <Space wrap>{data.reasonCodes!.map((value) => <Tag key={value}>{value}</Tag>)}</Space>}
  </div>;
}
