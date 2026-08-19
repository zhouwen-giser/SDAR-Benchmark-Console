import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Input, Select, Space, Table, Tag, Timeline, message } from "antd";
import { AlertOutlined, ArrowRightOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { AlertRecord } from "../types";
import { compactTime } from "../utils/format";

const severityColor: Record<AlertRecord["severity"], string> = { critical: "red", high: "orange", medium: "gold" };
const statusColor: Record<AlertRecord["status"], string> = { open: "red", acknowledged: "blue", resolved: "green" };

export function AlertsPage() {
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["alerts"], queryFn: () => consoleApi.listAlerts() });
  const [overrides, setOverrides] = useState<Record<string, Partial<AlertRecord>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const records = useMemo(() => (query.data?.data ?? []).map((item) => ({ ...item, ...overrides[item.alertId] })).filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (severity !== "all" && item.severity !== severity) return false;
    if (search && !`${item.alertId} ${item.title} ${item.targetId}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [query.data, overrides, search, severity, status]);
  const selectedBase = query.data?.data.find((item) => item.alertId === selectedId);
  const selected = selectedBase ? { ...selectedBase, ...overrides[selectedBase.alertId] } : null;

  const transition = (next: AlertRecord["status"]) => {
    if (!selected) return;
    const timestamp = next === "acknowledged" ? { acknowledgedAt: "2026-08-15T20:42:00Z" } : { resolvedAt: "2026-08-15T20:43:00Z" };
    setOverrides((current) => ({ ...current, [selected.alertId]: { ...current[selected.alertId], status: next, owner: "current-session", ...timestamp } }));
    messageApi.success(next === "acknowledged" ? "已在当前浏览会话中确认告警" : "已在当前浏览会话中标记为已解决");
  };

  const openTarget = (alert: AlertRecord) => {
    const path = alert.targetType === "case" ? `/cases/${alert.targetId}` : alert.targetType === "evaluation" ? `/evaluations/${alert.targetId}` : alert.targetType === "run" ? `/runs/${alert.targetId}` : "/analytics";
    navigateWithContext(path);
  };

  const columns = [
    { title: "Severity", dataIndex: "severity", key: "severity", width: 105, render: (value: AlertRecord["severity"]) => <Tag color={severityColor[value]}>{value.toUpperCase()}</Tag> },
    { title: "Alert", dataIndex: "title", key: "title", render: (value: string, row: AlertRecord) => <button className="alert-title-button" onClick={() => setSelectedId(row.alertId)}><b>{value}</b><small>{row.alertId}</small></button> },
    { title: "Status", dataIndex: "status", key: "status", width: 125, render: (value: AlertRecord["status"]) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: "Source", dataIndex: "source", key: "source", width: 150 },
    { title: "Target", dataIndex: "targetId", key: "targetId", width: 180, render: (value: string, row: AlertRecord) => <button className="link-button" onClick={() => openTarget(row)}>{row.targetType} · {value}</button> },
    { title: "Owner", dataIndex: "owner", key: "owner", width: 140 },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", width: 145, render: (value: string) => compactTime(value) },
    { title: "", key: "actions", width: 64, render: (_: unknown, row: AlertRecord) => <Button type="text" icon={<EyeOutlined />} aria-label={`查看 ${row.alertId}`} onClick={() => setSelectedId(row.alertId)} /> },
  ];

  return (
    <div className="standard-page alerts-page">
      {contextHolder}
      <PageHeader title="Alert Center" subtitle="聚合 Release Gate、Evaluation 与 Projection 关注项；仅展示轻量会话级生命周期，不扩张为通用工单平台。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      <div className="session-boundary-banner"><b>SESSION-LOCAL</b><span>Acknowledge / Resolve 尚无后端生命周期 API；本页操作只在当前浏览会话有效。</span></div>
      <div className="collection-stat-grid">
        <SectionCard className="collection-stat-danger"><span>OPEN</span><strong>{records.filter((item) => item.status === "open").length}</strong><small>requires action</small></SectionCard>
        <SectionCard><span>ACKNOWLEDGED</span><strong>{records.filter((item) => item.status === "acknowledged").length}</strong><small>owner assigned</small></SectionCard>
        <SectionCard><span>RESOLVED</span><strong>{records.filter((item) => item.status === "resolved").length}</strong><small>closed in lifecycle</small></SectionCard>
        <SectionCard><span>CRITICAL</span><strong>{records.filter((item) => item.severity === "critical").length}</strong><small>release impact</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search placeholder="Alert / Target" allowClear onSearch={setSearch} />
          <Select value={status} options={["all", "open", "acknowledged", "resolved"].map((value) => ({ value, label: value === "all" ? "全部状态" : value }))} onChange={setStatus} />
          <Select value={severity} options={["all", "critical", "high", "medium"].map((value) => ({ value, label: value === "all" ? "全部严重度" : value }))} onChange={setSeverity} />
          <Button onClick={() => { setStatus("all"); setSeverity("all"); setSearch(""); }}>清除</Button>
        </div>
        <Table<AlertRecord> rowKey="alertId" columns={columns} dataSource={records} loading={query.isLoading} pagination={false} scroll={{ x: 1180 }} rowClassName={(row) => row.severity === "critical" && row.status !== "resolved" ? "critical-table-row" : ""} />
      </SectionCard>
      <Drawer title={`Alert Detail · ${selected?.alertId ?? ""}`} width={720} open={Boolean(selected)} onClose={() => setSelectedId(null)} extra={selected && <Space>{selected.status === "open" && <Button onClick={() => transition("acknowledged")}>Acknowledge</Button>}{selected.status !== "resolved" && <Button type="primary" onClick={() => transition("resolved")}>Resolve</Button>}</Space>}>
        {selected && <div className="alert-detail">
          <div className={`alert-detail-hero severity-${selected.severity}`}><AlertOutlined /><div><Tag color={severityColor[selected.severity]}>{selected.severity.toUpperCase()}</Tag><h2>{selected.title}</h2><p>{selected.reason}</p></div></div>
          <Descriptions bordered column={2} size="small" items={[
            { key: "status", label: "Status", children: <Tag color={statusColor[selected.status]}>{selected.status}</Tag> },
            { key: "source", label: "Source", children: selected.source },
            { key: "target", label: "Target", children: `${selected.targetType} · ${selected.targetId}` },
            { key: "owner", label: "Owner", children: selected.owner ?? "Unassigned" },
            { key: "created", label: "Created", children: selected.createdAt },
            { key: "updated", label: "Lifecycle", children: selected.resolvedAt ?? selected.acknowledgedAt ?? "Awaiting action" },
          ]} />
          <h3>Lifecycle</h3>
          <Timeline items={[
            { color: "#ef4444", label: compactTime(selected.createdAt), children: <b>Alert opened by {selected.source}</b> },
            ...(selected.acknowledgedAt ? [{ color: "#3b82f6", label: compactTime(selected.acknowledgedAt), children: <b>Acknowledged · {selected.owner}</b> }] : []),
            ...(selected.resolvedAt ? [{ color: "#28c76f", label: compactTime(selected.resolvedAt), children: <b>Resolved · {selected.owner}</b> }] : []),
          ]} />
          <Button block type="primary" onClick={() => openTarget(selected)}>打开关联对象 <ArrowRightOutlined /></Button>
        </div>}
      </Drawer>
    </div>
  );
}
