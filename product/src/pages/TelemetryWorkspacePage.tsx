import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Table, Tag } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, SourceIdentity, compactTimestamp } from "../operational/components";
import type { TelemetrySourceView } from "../operational/types";

export function TelemetryWorkspacePage() {
  const query = useQuery({ queryKey: ["operational", "telemetry-sources"], queryFn: () => operationalApi.listTelemetrySources() });
  const [selected, setSelected] = useState<TelemetrySourceView | null>(null);
  const watermarks = useQuery({ queryKey: ["operational", "telemetry-source", selected?.sourceId, "watermarks"], queryFn: () => operationalApi.getTelemetryWatermarks(selected!.sourceId), enabled: Boolean(selected) });
  const drift = useQuery({ queryKey: ["operational", "telemetry-source", selected?.sourceId, "drift"], queryFn: () => operationalApi.getTelemetryDrift(selected!.sourceId), enabled: Boolean(selected) });
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError || !query.data) return <div className="standard-page"><OperationalError error={query.error ?? new Error("Telemetry registry unavailable")} onRetry={() => void query.refetch()} /></div>;
  const rows = query.data.data;
  return <div className="standard-page operational-page telemetry-page">
    <PageHeader title="Telemetry Workspace" subtitle="source identity、schema contract、四时间域与各阶段 lag 独立呈现；缺失与 drift 不会被推断为 ready。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <div className="operational-kpi-grid">
      <SectionCard><span>Sources</span><strong>{rows.length}</strong><small>versioned telemetry registry</small></SectionCard>
      <SectionCard><span>Ready</span><strong>{rows.filter((item) => item.status === "ready").length}</strong><small>contract + source identity</small></SectionCard>
      <SectionCard><span>Conflicts</span><strong>{rows.reduce((sum, item) => sum + item.counts.conflictCount, 0)}</strong><small>identity/field conflicts</small></SectionCard>
      <SectionCard><span>Unresolved</span><strong>{rows.reduce((sum, item) => sum + item.counts.unresolvedCount, 0)}</strong><small>not inferred from hints</small></SectionCard>
    </div>
    <SectionCard title="Telemetry source registry"><Table<TelemetrySourceView> rowKey="sourceId" pagination={false} dataSource={rows} scroll={{ x: 1450 }} columns={[
      { title: "Source", dataIndex: "sourceId", fixed: "left", render: (value: string, row) => <button className="link-button" onClick={() => setSelected(row)}>{value}</button> },
      { title: "Type", dataIndex: "sourceType" }, { title: "Component", dataIndex: "componentId" }, { title: "Contract", dataIndex: "contractVersion", render: (value: string | null) => value ?? "unresolved" },
      { title: "Status", dataIndex: "status", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Facts", dataIndex: ["counts", "factCount"] }, { title: "Relations", dataIndex: ["counts", "relationCount"] },
      { title: "Observed", dataIndex: ["timestamps", "lastObservedAt"], render: compactTimestamp }, { title: "Received", dataIndex: ["timestamps", "lastReceivedAt"], render: compactTimestamp }, { title: "Ingested", dataIndex: ["timestamps", "lastIngestedAt"], render: compactTimestamp }, { title: "Projected", dataIndex: ["timestamps", "lastProjectedAt"], render: compactTimestamp },
      { title: "", key: "actions", fixed: "right", render: (_: unknown, row) => <Button type="text" icon={<EyeOutlined />} aria-label={`查看 ${row.sourceId}`} onClick={() => setSelected(row)} /> },
    ]} /></SectionCard>
    <Drawer open={selected !== null} onClose={() => setSelected(null)} width={780} title={selected ? `Telemetry Source · ${selected.sourceId}` : "Telemetry Source"}>
      {selected && <div className="operational-drawer-stack">
        <SourceIdentity values={[
          { label: "Source ID", value: selected.sourceId }, { label: "Type", value: selected.sourceType }, { label: "Component", value: selected.componentId },
          { label: "Environment", value: selected.environmentId ?? "unavailable" }, { label: "Contract", value: selected.contractVersion ?? "unresolved" }, { label: "Schema hash", value: selected.schemaHash ?? "unresolved" },
          { label: "Source identity", value: selected.sourceIdentity ?? "unresolved" }, { label: "Status", value: <OperationalStatusTag value={selected.status} /> }, { label: "Reasons", value: (selected.reasonCodes ?? []).join(" · ") || "—" },
        ]} />
        <SectionCard title="Stage watermarks and lag">{watermarks.isLoading ? <OperationalLoading label="正在读取 telemetry watermarks" /> : watermarks.isError ? <OperationalError error={watermarks.error} /> : <Descriptions bordered column={1} items={watermarks.data ? [
          { key: "observed", label: "sourceObservedAt", children: compactTimestamp(watermarks.data.data.observed) }, { key: "received", label: "receivedAt", children: compactTimestamp(watermarks.data.data.received) },
          { key: "ingested", label: "ingestedAt", children: compactTimestamp(watermarks.data.data.ingested) }, { key: "projected", label: "projectedAt", children: compactTimestamp(watermarks.data.data.projected) },
          { key: "lag1", label: "Observed → received", children: ms(watermarks.data.data.lags.observedToReceivedMs) }, { key: "lag2", label: "Received → ingested", children: ms(watermarks.data.data.lags.receivedToIngestedMs) }, { key: "lag3", label: "Ingested → projected", children: ms(watermarks.data.data.lags.ingestedToProjectedMs) },
        ] : []} />}</SectionCard>
        <SectionCard title="Contract drift">{drift.isError ? <OperationalError error={drift.error} /> : drift.data && <Descriptions bordered column={1} items={[
          { key: "status", label: "Compatibility", children: <OperationalStatusTag value={drift.data.data.compatibilityStatus} /> },
          { key: "missing", label: "Missing fields", children: tags(drift.data.data.missingFields) }, { key: "extra", label: "Extra fields", children: tags(drift.data.data.extraFields) },
          { key: "mismatch", label: "Type mismatches", children: drift.data.data.typeMismatches.length }, { key: "runs", label: "Affected Runs", children: tags(drift.data.data.affectedRuns) },
        ]} />}</SectionCard>
      </div>}
    </Drawer>
  </div>;
}

function ms(value: number | null | undefined) { return value == null ? "unavailable" : `${value} ms`; }
function tags(values: string[]) { return values.length ? values.map((value) => <Tag key={value}>{value}</Tag>) : "—"; }
