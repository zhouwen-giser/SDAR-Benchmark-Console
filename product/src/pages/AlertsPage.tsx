import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Input, Select, Space, Table, Tag, Timeline, message } from "antd";
import { AlertOutlined, ArrowRightOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi, currentApiMode } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { AlertRecord } from "../types";
import { actorName, compactTime, severityName, sourceName, statusName, targetTypeName } from "../utils/format";
import { operationalApi } from "../operational/api";
import { OperationalMetaStrip, OperationalStatusTag } from "../operational/components";

const severityColor: Record<AlertRecord["severity"], string> = { critical: "red", high: "orange", medium: "gold" };
const statusColor: Record<AlertRecord["status"], string> = { open: "red", acknowledged: "blue", resolved: "green", ignored: "default" };

export function AlertsPage() {
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["alerts"], queryFn: () => consoleApi.listAlerts() });
  const [overrides, setOverrides] = useState<Record<string, Partial<AlertRecord>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const live = currentApiMode() === "http";
  const detailQuery = useQuery({ queryKey: ["attention-item", selectedId], queryFn: ({ signal }) => consoleApi.getAttention(selectedId!, { signal }), enabled: live && Boolean(selectedId) });
  const timelineQuery = useQuery({ queryKey: ["operational-attention-timeline", selectedId], queryFn: ({ signal }) => operationalApi.getAttentionTimeline(selectedId!, { signal }), enabled: Boolean(selectedId), retry: false });
  const evidenceQuery = useQuery({ queryKey: ["operational-attention-evidence", selectedId], queryFn: ({ signal }) => operationalApi.getAttentionEvidence(selectedId!, { signal }), enabled: Boolean(selectedId), retry: false });
  const records = useMemo(() => (query.data?.data ?? []).map((item) => ({ ...item, ...overrides[item.alertId] })).filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (severity !== "all" && item.severity !== severity) return false;
    if (search && !`${item.alertId} ${item.title} ${item.targetId}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [query.data, overrides, search, severity, status]);
  const selectedBase = detailQuery.data?.data ?? query.data?.data.find((item) => item.alertId === selectedId);
  const selected = selectedBase ? { ...selectedBase, ...overrides[selectedBase.alertId] } : null;

  const transition = async (next: AlertRecord["status"]) => {
    if (!selected) return;
    if (live) {
      try {
        await consoleApi.updateAttention(selected.alertId, next);
        messageApi.success(`关注项状态已由后端持久化为 ${next}`);
        await query.refetch();
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "更新关注项失败");
      }
      return;
    }
    const timestamp = next === "acknowledged" ? { acknowledgedAt: "2026-08-15T20:42:00Z" } : { resolvedAt: "2026-08-15T20:43:00Z" };
    setOverrides((current) => ({ ...current, [selected.alertId]: { ...current[selected.alertId], status: next, owner: "current-session", ...timestamp } }));
    messageApi.success(next === "acknowledged" ? "已在当前浏览会话中确认告警" : "已在当前浏览会话中标记为已解决");
  };

  const openTarget = (alert: AlertRecord) => {
    const path = alert.targetType === "case" ? `/cases/${alert.targetId}` : alert.targetType === "evaluation" ? `/evaluations/${alert.targetId}` : alert.targetType === "run" ? `/runs/${alert.targetId}` : "/analytics";
    navigateWithContext(path);
  };

  const openSubject = (kind: string, id: string) => {
    const path = kind === "run" ? `/runs/${encodeURIComponent(id)}`
      : kind === "resource" ? `/resources/${encodeURIComponent(id)}`
        : kind === "environment" ? `/environments/${encodeURIComponent(id)}`
          : kind === "evaluation" ? `/evaluations/${encodeURIComponent(id)}`
            : kind === "telemetry_source" ? "/telemetry"
              : kind === "reconciliation_job" ? `/reconciliation?jobId=${encodeURIComponent(id)}`
                : null;
    if (path) navigateWithContext(path);
  };

  const columns = [
    { title: "严重度", dataIndex: "severity", key: "severity", width: 105, render: (value: AlertRecord["severity"]) => <Tag color={severityColor[value]}>{severityName(value)}</Tag> },
    { title: "告警", dataIndex: "title", key: "title", render: (value: string, row: AlertRecord) => <button className="alert-title-button" onClick={() => setSelectedId(row.alertId)}><b>{value}</b><small>{row.alertId}</small></button> },
    { title: "状态", dataIndex: "status", key: "status", width: 125, render: (value: AlertRecord["status"]) => <Tag color={statusColor[value]}>{statusName(value)}</Tag> },
    { title: "来源", dataIndex: "source", key: "source", width: 150, render: (value: string) => sourceName(value) },
    { title: "关联对象", dataIndex: "targetId", key: "targetId", width: 200, render: (value: string, row: AlertRecord) => <button className="link-button" onClick={() => openTarget(row)}>{targetTypeName(row.targetType)} · {value}</button> },
    { title: "负责人", dataIndex: "owner", key: "owner", width: 140, render: (value: string | undefined) => actorName(value) },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 145, render: (value: string) => compactTime(value) },
    { title: "", key: "actions", width: 64, render: (_: unknown, row: AlertRecord) => <Button type="text" icon={<EyeOutlined />} aria-label={`查看 ${row.alertId}`} onClick={() => setSelectedId(row.alertId)} /> },
  ];

  return (
    <div className="standard-page alerts-page">
      {contextHolder}
      <PageHeader title="重点关注队列" subtitle={live ? "确认与解决操作通过 /v1/attention-items 持久化。" : "Mock 模式使用会话级生命周期。"} meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      {!live && <div className="session-boundary-banner"><b>仅当前会话</b><span>Mock 模式操作只在当前浏览会话有效。</span></div>}
      <div className="collection-stat-grid">
        <SectionCard className="collection-stat-danger"><span>待处理</span><strong>{records.filter((item) => item.status === "open").length}</strong><small>需要采取措施</small></SectionCard>
        <SectionCard><span>已确认</span><strong>{records.filter((item) => item.status === "acknowledged").length}</strong><small>已分配负责人</small></SectionCard>
        <SectionCard><span>已解决</span><strong>{records.filter((item) => item.status === "resolved").length}</strong><small>生命周期已关闭</small></SectionCard>
        <SectionCard><span>极高严重度</span><strong>{records.filter((item) => item.severity === "critical").length}</strong><small>影响发布</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search placeholder="告警编号 / 关联对象" allowClear onSearch={setSearch} />
          <Select value={status} options={["all", "open", "acknowledged", "resolved"].map((value) => ({ value, label: value === "all" ? "全部状态" : statusName(value) }))} onChange={setStatus} />
          <Select value={severity} options={["all", "critical", "high", "medium"].map((value) => ({ value, label: value === "all" ? "全部严重度" : severityName(value) }))} onChange={setSeverity} />
          <Button onClick={() => { setStatus("all"); setSeverity("all"); setSearch(""); }}>清除</Button>
        </div>
        <Table<AlertRecord> rowKey="alertId" columns={columns} dataSource={records} loading={query.isLoading} pagination={false} scroll={{ x: 1180 }} rowClassName={(row) => row.severity === "critical" && row.status !== "resolved" ? "critical-table-row" : ""} />
      </SectionCard>
      <Drawer title={`关注项详情 · ${selected?.alertId ?? ""}`} width={720} open={Boolean(selected)} onClose={() => setSelectedId(null)} extra={selected && <Space>{selected.status === "open" && <Button onClick={() => void transition("acknowledged")}>确认关注项</Button>}{selected.status !== "resolved" && <Button type="primary" onClick={() => void transition("resolved")}>标记为已解决</Button>}</Space>}>
        {selected && <div className="alert-detail">
          <div className={`alert-detail-hero severity-${selected.severity}`}><AlertOutlined /><div><Tag color={severityColor[selected.severity]}>{severityName(selected.severity)}</Tag><h2>{selected.title}</h2><p>{selected.reason}</p></div></div>
          <Descriptions bordered column={2} size="small" items={[
            { key: "status", label: "状态", children: <Tag color={statusColor[selected.status]}>{statusName(selected.status)}</Tag> },
            { key: "source", label: "来源", children: sourceName(selected.source) },
            { key: "target", label: "关联对象", children: `${targetTypeName(selected.targetType)} · ${selected.targetId}` },
            { key: "owner", label: "负责人", children: actorName(selected.owner) },
            { key: "created", label: "创建时间", children: selected.createdAt },
            { key: "updated", label: "生命周期更新时间", children: selected.resolvedAt ?? selected.acknowledgedAt ?? "等待处理" },
          ]} />
          <h3>生命周期</h3>
          <Timeline items={[
            { color: "#ef4444", label: compactTime(selected.createdAt), children: <b>{sourceName(selected.source)}创建告警</b> },
            ...(selected.acknowledgedAt ? [{ color: "#3b82f6", label: compactTime(selected.acknowledgedAt), children: <b>已确认 · {actorName(selected.owner)}</b> }] : []),
            ...(selected.resolvedAt ? [{ color: "#28c76f", label: compactTime(selected.resolvedAt), children: <b>已解决 · {actorName(selected.owner)}</b> }] : []),
            ...(timelineQuery.data?.data ?? []).map((event) => ({ color: "#64748b", label: compactTime(event.occurredAt), children: <span><b>{event.eventType}</b> · {event.source} · {event.dataClass}</span> })),
          ]} />
          {timelineQuery.data && <OperationalMetaStrip meta={timelineQuery.data.meta} />}
          {evidenceQuery.data && <SectionCard title="Native attention evidence">
            <Space wrap>{evidenceQuery.data.data.subjects.map((subject) => <Button key={`${subject.kind}:${subject.id}`} type="link" onClick={() => openSubject(subject.kind, subject.id)}>{subject.kind} · {subject.id} <ArrowRightOutlined /></Button>)}</Space>
            <Descriptions size="small" bordered column={1} items={[
              { key: "class", label: "Data class", children: <OperationalStatusTag value={evidenceQuery.data.meta.dataClass} /> },
              { key: "evidence", label: "Evidence refs", children: evidenceQuery.data.data.evidenceRefs.join(" · ") || "—" },
              { key: "timeline", label: "Timeline refs", children: evidenceQuery.data.data.timelineRefs.join(" · ") || "—" },
              { key: "reasons", label: "Reason codes", children: evidenceQuery.data.data.reasonCodes.join(" · ") || "—" },
            ]} />
          </SectionCard>}
          <Button block type="primary" onClick={() => openTarget(selected)}>打开关联对象 <ArrowRightOutlined /></Button>
        </div>}
      </Drawer>
    </div>
  );
}
