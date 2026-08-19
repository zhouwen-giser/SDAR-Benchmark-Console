import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Drawer, Segmented, Table, Tabs, Tag, Timeline, message } from "antd";
import { ApiOutlined, CheckCircleFilled, CloseCircleFilled, DiffOutlined, LinkOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { EvidenceGraphChart } from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvidenceTimelineItem } from "../types";

function TimelineView({ data, onRecord }: { data: EvidenceTimelineItem[]; onRecord: (record: EvidenceTimelineItem) => void }) {
  return (
    <SectionCard className="evidence-tab-card">
      <Timeline
        mode="left"
        items={data.map((item) => ({
          color: item.status === "warning" ? "#f5b942" : "#3b82f6",
          label: item.time,
          children: <button className="timeline-record" onClick={() => onRecord(item)}><b>{item.label}</b><span>{item.type}</span><small>{item.id}</small></button>,
        }))}
      />
    </SectionCard>
  );
}

export function EvidencePage() {
  const { bundleId = "bundle-cand-mcp17" } = useParams();
  const { searchParams, navigateWithContext } = useAnalysisContext();
  const tab = searchParams.get("tab") ?? "timeline";
  const [record, setRecord] = useState<EvidenceTimelineItem | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const query = useQuery({ queryKey: ["evidence", bundleId], queryFn: () => consoleApi.getEvidence(bundleId) });
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 immutable Evidence Bundle…</div></SectionCard></div>;
  const data = query.data.data;
  const timelineMeta = capabilityMeta("evidenceTimeline", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const diffMeta = capabilityMeta("evidenceDiff", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const externalMeta = capabilityMeta("telemetryTrace", { mocked: false });
  const recordColumns = [
    { title: "Time", dataIndex: "time", key: "time", width: 100 },
    { title: "Family / Type", dataIndex: "type", key: "type" },
    { title: "Role", dataIndex: "label", key: "label" },
    { title: "Record ID", dataIndex: "id", key: "id", render: (value: string, row: EvidenceTimelineItem) => <button className="link-button" onClick={() => setRecord(row)}>{value}</button> },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "warning" ? "gold" : "green"}>{value}</Tag> },
    { title: "Hash", key: "hash", render: (_: unknown, row: EvidenceTimelineItem) => <code>sha256:{row.id.padEnd(12, "0")}</code> },
  ];

  const tabItems = [
    { key: "timeline", label: "Timeline", children: <TimelineView data={data.timeline} onRecord={setRecord} /> },
    { key: "graph", label: "Graph", children: <SectionCard className="evidence-tab-card evidence-graph-card"><EvidenceGraphChart data={data} onNode={(id) => setRecord(data.timeline.find((item) => item.id === id) ?? { id, type: "runtime.receipt", label: "Receipt (missing)", time: "—", status: "missing" })} /></SectionCard> },
    { key: "records", label: `Records (${data.recordCount})`, children: <SectionCard className="evidence-tab-card table-card"><div className="record-filter-strip"><Segmented options={["All", "Runtime", "Skill", "MCP Task", "Evidence"]} defaultValue="All" /><span>Immutable record index · bounded payload</span></div><Table<EvidenceTimelineItem> rowKey="id" columns={recordColumns} dataSource={data.timeline} pagination={false} /></SectionCard> },
    { key: "diff", label: <span><DiffOutlined /> Diff</span>, children: <SectionCard title="Baseline / Candidate Evidence Difference" extra={<ApiStatusTag compact meta={diffMeta} />} className="evidence-tab-card evidence-diff-card"><Alert type="error" showIcon message="Candidate 缺少 durable Receipt" description="Action 存在且 Continuation 完成，但 Baseline 中的 receipt-R1 在 Candidate Bundle 被移除；Verification 由 pass 变为 insufficient。" /><div className="evidence-diff-flow"><div className="diff-node normal"><span>Action</span><b>action-A123</b><small>present</small></div><i /><div className="diff-node missing"><CloseCircleFilled /><span>Receipt</span><b>receipt-R1</b><small>REMOVED</small></div><i /><div className="diff-node warning"><span>Verification</span><b>verify-V9</b><small>pass → insufficient</small></div></div><div className="diff-columns"><div><h3>Baseline · {data.diff.baselineBundleId}</h3><p><CheckCircleFilled className="text-positive" /> Receipt persisted and referenced by Verification.</p><p><CheckCircleFilled className="text-positive" /> payload.result = pass</p></div><div><h3>Candidate · {data.bundleId}</h3>{data.diff.removed.map((item) => <p key={item.id}><CloseCircleFilled className="text-danger" /> REMOVED {item.type} · {item.id}</p>)}{data.diff.changed.map((item) => <p key={item.id}><DiffOutlined className="text-warning" /> CHANGED {item.field}: {item.baseline} → {item.candidate}</p>)}</div></div></SectionCard> },
    { key: "raw", label: "Raw", children: <SectionCard className="evidence-tab-card raw-json-card"><Alert type="info" showIcon message="Raw JSON 仅作为最后一层验证，不是首要交互。" /><pre>{JSON.stringify(data, null, 2)}</pre></SectionCard> },
  ];

  return (
    <div className="standard-page evidence-page">
      {contextHolder}
      <PageHeader
        title={`Evidence Bundle ${data.bundleId}`}
        subtitle={`${data.episodeId} · Manifest rev ${data.manifestRevision} · Immutable Artifact`}
        meta={query.data.meta}
        actions={<><ApiStatusTag compact meta={externalMeta} /><Button icon={<ApiOutlined />} onClick={() => messageApi.info("Raw Trace 由 Telemetry Query API 提供；本 Mock 环境未配置外部地址。")}>Open Raw Trace</Button></>}
      />
      <div className="bundle-header-grid">
        <SectionCard className="bundle-identity"><span>BUNDLE STATUS</span><strong>{data.status.toUpperCase()}</strong><small>Manifest rev {data.manifestRevision}</small></SectionCard>
        <SectionCard className="bundle-description">
          <Descriptions size="small" column={5} items={[
            { key: "records", label: "Record Count", children: data.recordCount },
            { key: "sequence", label: "Sequence", children: data.sequenceRange.join("–") },
            { key: "required", label: "Required Families", children: data.requiredFamilies.join(", ") },
            { key: "missing", label: "Missing Families", children: data.missingFamilies.length ? data.missingFamilies.join(", ") : <Tag color="green">None</Tag> },
            { key: "hash", label: "Bundle Hash", children: <code>{data.bundleHash}</code> },
          ]} />
        </SectionCard>
      </div>
      <div className="evidence-tabs-header"><ApiStatusTag compact meta={timelineMeta} /></div>
      <Tabs activeKey={tab} items={tabItems} onChange={(key) => navigateWithContext(`/evidence-bundles/${bundleId}`, { tab: key })} />
      <Drawer title={`Evidence Record ${record?.id ?? ""}`} width={720} open={Boolean(record)} onClose={() => setRecord(null)}>
        {record && <><Descriptions bordered size="small" column={1} items={[
          { key: "id", label: "Record ID", children: record.id },
          { key: "type", label: "Type", children: record.type },
          { key: "role", label: "Evidence Role", children: record.label },
          { key: "time", label: "Semantic Time", children: record.time },
          { key: "status", label: "Status", children: <Tag color={record.status === "missing" ? "red" : record.status === "warning" ? "gold" : "green"}>{record.status}</Tag> },
          { key: "hash", label: "Record Hash", children: <code>sha256:{record.id.padEnd(24, "0")}</code> },
          { key: "refs", label: "References", children: record.id === "verify-V9" ? "action-A123 · receipt-R1 (missing)" : "bounded immutable refs" },
        ]} /><h3>Bounded payload</h3><pre className="drawer-json">{JSON.stringify({ id: record.id, type: record.type, sourceRevision: 4, status: record.status, payload: record.status === "missing" ? null : { result: record.id === "verify-V9" ? "insufficient" : "recorded" } }, null, 2)}</pre></>}
      </Drawer>
    </div>
  );
}
