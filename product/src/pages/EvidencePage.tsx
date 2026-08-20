import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Drawer, Segmented, Table, Tabs, Tag, Timeline, message } from "antd";
import { ApiOutlined, CheckCircleFilled, CloseCircleFilled, DiffOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { EvidenceGraphChart } from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvidenceTimelineItem } from "../types";
import { evidenceFamilyName, evidenceLabelName, statusName } from "../utils/format";

function TimelineView({ data, onRecord }: { data: EvidenceTimelineItem[]; onRecord: (record: EvidenceTimelineItem) => void }) {
  return (
    <SectionCard className="evidence-tab-card">
      <Timeline
        mode="left"
        items={data.map((item) => ({
          color: item.status === "warning" ? "#f5b942" : "#3b82f6",
          label: item.time,
          children: <button className="timeline-record" onClick={() => onRecord(item)}><b>{evidenceLabelName(item.label)}</b><span>{evidenceFamilyName(item.type)}</span><small>{item.id}</small></button>,
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
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载不可变证据包…</div></SectionCard></div>;
  const data = query.data.data;
  const timelineMeta = capabilityMeta("evidenceTimeline", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const diffMeta = capabilityMeta("evidenceDiff", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const externalMeta = capabilityMeta("telemetryTrace", { mocked: false });
  const recordColumns = [
    { title: "语义时间", dataIndex: "time", key: "time", width: 100 },
    { title: "证据族 / 类型", dataIndex: "type", key: "type", render: (value: string) => evidenceFamilyName(value) },
    { title: "证据角色", dataIndex: "label", key: "label", render: (value: string) => evidenceLabelName(value) },
    { title: "记录编号", dataIndex: "id", key: "id", render: (value: string, row: EvidenceTimelineItem) => <button className="link-button" onClick={() => setRecord(row)}>{value}</button> },
    { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "warning" ? "gold" : "green"}>{statusName(value)}</Tag> },
    { title: "内容哈希", key: "hash", render: (_: unknown, row: EvidenceTimelineItem) => <code>sha256:{row.id.padEnd(12, "0")}</code> },
  ];

  const localizedRawView = {
    证据包编号: data.bundleId,
    执行过程编号: data.episodeId,
    清单修订版: data.manifestRevision,
    状态: statusName(data.status),
    记录数量: data.recordCount,
    序列范围: data.sequenceRange,
    证据包哈希: data.bundleHash,
    必需证据族: data.requiredFamilies.map(evidenceFamilyName),
    缺失证据族: data.missingFamilies.map(evidenceFamilyName),
    证据时间线: data.timeline.map((item) => ({
      记录编号: item.id,
      证据类型: evidenceFamilyName(item.type),
      证据角色: evidenceLabelName(item.label),
      语义时间: item.time,
      状态: statusName(item.status),
    })),
  };

  const tabItems = [
    { key: "timeline", label: "时间线", children: <TimelineView data={data.timeline} onRecord={setRecord} /> },
    { key: "graph", label: "关系图", children: <SectionCard className="evidence-tab-card evidence-graph-card"><EvidenceGraphChart data={data} onNode={(id) => setRecord(data.timeline.find((item) => item.id === id) ?? { id, type: "runtime.receipt", label: "Receipt (missing)", time: "—", status: "missing" })} /></SectionCard> },
    { key: "records", label: `证据记录（${data.recordCount}）`, children: <SectionCard className="evidence-tab-card table-card"><div className="record-filter-strip"><Segmented options={["全部", "运行时", "技能", "MCP 任务", "评价证据"]} defaultValue="全部" /><span>不可变记录索引 · 载荷范围受限</span></div><Table<EvidenceTimelineItem> rowKey="id" columns={recordColumns} dataSource={data.timeline} pagination={false} /></SectionCard> },
    { key: "diff", label: <span><DiffOutlined /> 证据差异</span>, children: <SectionCard title="基准版本与候选版本的证据差异" extra={<ApiStatusTag compact meta={diffMeta} />} className="evidence-tab-card evidence-diff-card"><Alert type="error" showIcon message="候选版本缺少可持久化执行回执" description="执行动作存在且任务续传完成，但基准版本中的 receipt-R1 在候选证据包中缺失；验证结果由“通过”变为“证据不足”。" /><div className="evidence-diff-flow"><div className="diff-node normal"><span>执行动作</span><b>action-A123</b><small>存在</small></div><i /><div className="diff-node missing"><CloseCircleFilled /><span>执行回执</span><b>receipt-R1</b><small>已移除</small></div><i /><div className="diff-node warning"><span>结果验证</span><b>verify-V9</b><small>通过 → 证据不足</small></div></div><div className="diff-columns"><div><h3>基准版本 · {data.diff.baselineBundleId}</h3><p><CheckCircleFilled className="text-positive" /> 执行回执已持久化，并被结果验证记录引用。</p><p><CheckCircleFilled className="text-positive" /> 结果字段（payload.result）为“通过”</p></div><div><h3>候选版本 · {data.bundleId}</h3>{data.diff.removed.map((item) => <p key={item.id}><CloseCircleFilled className="text-danger" /> 已移除 {evidenceFamilyName(item.type)} · {item.id}</p>)}{data.diff.changed.map((item) => <p key={item.id}><DiffOutlined className="text-warning" /> 已变更 结果字段（{item.field}）：通过 → 证据不足</p>)}</div></div></SectionCard> },
    { key: "raw", label: "结构化原始数据", children: <SectionCard className="evidence-tab-card raw-json-card"><Alert type="info" showIcon message="结构化原始数据仅用于最后一层核验；协议标识符会保留原始代码，并同时提供中文说明。" /><pre>{JSON.stringify(localizedRawView, null, 2)}</pre></SectionCard> },
  ];

  return (
    <div className="standard-page evidence-page">
      {contextHolder}
      <PageHeader
        title={`证据包 ${data.bundleId}`}
        subtitle={`${data.episodeId} · 清单第 ${data.manifestRevision} 版 · 不可变制品`}
        meta={query.data.meta}
        actions={<><ApiStatusTag compact meta={externalMeta} /><Button icon={<ApiOutlined />} onClick={() => messageApi.info("原始追踪记录由遥测查询接口提供；当前演示环境未配置外部地址。")}>打开原始追踪记录</Button></>}
      />
      <div className="bundle-header-grid">
        <SectionCard className="bundle-identity"><span>证据包状态</span><strong>{statusName(data.status)}</strong><small>清单第 {data.manifestRevision} 版</small></SectionCard>
        <SectionCard className="bundle-description">
          <Descriptions size="small" column={5} items={[
            { key: "records", label: "记录数量", children: data.recordCount },
            { key: "sequence", label: "序列范围", children: data.sequenceRange.join("–") },
            { key: "required", label: "必需证据族", children: data.requiredFamilies.map(evidenceFamilyName).join("、") },
            { key: "missing", label: "缺失证据族", children: data.missingFamilies.length ? data.missingFamilies.map(evidenceFamilyName).join("、") : <Tag color="green">无</Tag> },
            { key: "hash", label: "证据包哈希", children: <code>{data.bundleHash}</code> },
          ]} />
        </SectionCard>
      </div>
      <div className="evidence-tabs-header"><ApiStatusTag compact meta={timelineMeta} /></div>
      <Tabs activeKey={tab} items={tabItems} onChange={(key) => navigateWithContext(`/evidence-bundles/${bundleId}`, { tab: key })} />
      <Drawer title={`证据记录 ${record?.id ?? ""}`} width={720} open={Boolean(record)} onClose={() => setRecord(null)}>
        {record && <><Descriptions bordered size="small" column={1} items={[
          { key: "id", label: "记录编号", children: record.id },
          { key: "type", label: "证据类型", children: evidenceFamilyName(record.type) },
          { key: "role", label: "证据角色", children: evidenceLabelName(record.label) },
          { key: "time", label: "语义时间", children: record.time },
          { key: "status", label: "状态", children: <Tag color={record.status === "missing" ? "red" : record.status === "warning" ? "gold" : "green"}>{record.status === "missing" ? "缺失" : statusName(record.status)}</Tag> },
          { key: "hash", label: "记录哈希", children: <code>sha256:{record.id.padEnd(24, "0")}</code> },
          { key: "refs", label: "关联引用", children: record.id === "verify-V9" ? "action-A123 · receipt-R1（缺失）" : "范围受限的不可变引用" },
        ]} /><h3>范围受限的记录载荷</h3><pre className="drawer-json">{JSON.stringify({ 记录编号: record.id, 证据类型: evidenceFamilyName(record.type), 来源修订版: 4, 状态: record.status === "missing" ? "缺失" : statusName(record.status), 载荷: record.status === "missing" ? null : { 结果: record.id === "verify-V9" ? "证据不足" : "已记录" } }, null, 2)}</pre></>}
      </Drawer>
    </div>
  );
}
