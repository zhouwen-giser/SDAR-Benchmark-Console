import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Input, Select, Table, Tag, message } from "antd";
import { EyeOutlined, FileTextOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { ReportRecord } from "../types";
import { actorName, compactTime, reportSectionName, reportTypeName, statusName } from "../utils/format";

export function ReportsPage() {
  const { filters } = useAnalysisContext();
  const query = useQuery({ queryKey: ["reports"], queryFn: () => consoleApi.listReports() });
  const [drafts, setDrafts] = useState<ReportRecord[]>([]);
  const [selected, setSelected] = useState<ReportRecord | null>(null);
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const records = useMemo(() => [...drafts, ...(query.data?.data ?? [])].filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (search && !`${item.reportId} ${item.title} ${item.scope}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [drafts, query.data, search, type]);

  const createDraft = () => {
    const draft: ReportRecord = {
      reportId: `DRAFT-${String(drafts.length + 1).padStart(3, "0")}`,
      title: `候选版本 ${filters.candidateId} 发布评审`,
      type: "release_review",
      status: "draft",
      scope: `${filters.runId} · ${filters.datasetVersion}`,
      format: "Markdown",
      sections: ["发布结论", "质量摘要", "阻塞用例", "证据审计", "建议措施"],
      createdAt: "2026-08-15T20:40:00Z",
      createdBy: "current-session",
    };
    setDrafts((current) => [draft, ...current]);
    setSelected(draft);
    messageApi.success("已在当前浏览会话中创建报告草稿");
  };

  const downloadJson = (report: ReportRecord) => {
    const payload = {
      report,
      context: filters,
      releaseDecision: "BLOCKED",
      blockingCases: ["MCP-RESTART-017", "MCP-RESTART-021"],
      note: "由确定性演示数据快照在当前会话中生成。",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.reportId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    messageApi.success("报告 JSON 已生成");
  };

  const columns = [
    { title: "报告编号", dataIndex: "reportId", key: "reportId", width: 160, render: (value: string, row: ReportRecord) => <button className="link-button" onClick={() => setSelected(row)}>{value}</button> },
    { title: "报告标题", dataIndex: "title", key: "title" },
    { title: "报告类型", dataIndex: "type", key: "type", width: 165, render: (value: ReportRecord["type"]) => reportTypeName(value) },
    { title: "状态", dataIndex: "status", key: "status", width: 100, render: (value: string) => <Tag color={value === "ready" ? "green" : "gold"}>{statusName(value)}</Tag> },
    { title: "报告范围", dataIndex: "scope", key: "scope", width: 235 },
    { title: "文件格式", dataIndex: "format", key: "format", width: 100, render: (value: string) => value === "JSON" ? "JSON 数据" : "Markdown 文档" },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 150, render: (value: string) => compactTime(value) },
    { title: "", key: "actions", width: 72, render: (_: unknown, row: ReportRecord) => <Button type="text" icon={<EyeOutlined />} aria-label={`预览 ${row.reportId}`} onClick={() => setSelected(row)} /> },
  ];

  return (
    <div className="standard-page reports-page">
      {contextHolder}
      <PageHeader title="报告中心" subtitle="生成可审阅的发布、回归与证据摘要；后端报告服务尚未实现。" meta={query.data?.meta} actions={<><Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button><Button type="primary" icon={<FileTextOutlined />} onClick={createDraft}>新建发布评审草稿</Button></>} />
      <div className="session-boundary-banner"><b>仅当前会话</b><span>新建草稿与预览不会写入后端；离开页面或刷新后会丢失。可下载 JSON 数据用于交接。</span></div>
      <div className="collection-stat-grid">
        <SectionCard><span>可用报告</span><strong>{records.length}</strong><small>包含当前会话草稿</small></SectionCard>
        <SectionCard><span>可供评审</span><strong>{records.filter((item) => item.status === "ready").length}</strong><small>已生成可审阅内容</small></SectionCard>
        <SectionCard><span>草稿</span><strong>{records.filter((item) => item.status === "draft").length}</strong><small>尚未持久化</small></SectionCard>
        <SectionCard><span>导出格式</span><strong>JSON</strong><small>在浏览器本地生成</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search placeholder="报告编号 / 标题 / 范围" allowClear onSearch={setSearch} />
          <Select value={type} options={[{ value: "all", label: "全部类型" }, { value: "release_review", label: reportTypeName("release_review") }, { value: "regression_digest", label: reportTypeName("regression_digest") }, { value: "evidence_audit", label: reportTypeName("evidence_audit") }]} onChange={setType} />
          <Button onClick={() => { setType("all"); setSearch(""); }}>清除</Button>
        </div>
        <Table<ReportRecord> rowKey="reportId" columns={columns} dataSource={records} loading={query.isLoading} pagination={false} scroll={{ x: 1180 }} />
      </SectionCard>
      <Drawer title={`报告预览 · ${selected?.reportId ?? ""}`} width={760} open={Boolean(selected)} onClose={() => setSelected(null)} extra={selected && <Button type="primary" onClick={() => downloadJson(selected)}>下载 JSON 数据</Button>}>
        {selected && <div className="report-preview">
          <div className="report-cover"><span>SDAR 基准质量评测</span><h2>{selected.title}</h2><p>{selected.scope}</p><Tag color={selected.status === "ready" ? "green" : "gold"}>{statusName(selected.status)}</Tag></div>
          <Descriptions column={2} bordered size="small" items={[
            { key: "type", label: "报告类型", children: reportTypeName(selected.type) },
            { key: "format", label: "文件格式", children: selected.format === "JSON" ? "JSON 数据" : "Markdown 文档" },
            { key: "created", label: "创建时间", children: selected.createdAt },
            { key: "by", label: "创建者", children: actorName(selected.createdBy) },
          ]} />
          <h3>报告章节</h3>
          <ol className="report-section-list">{selected.sections.map((section, index) => <li key={section}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{reportSectionName(section)}</b><p>{section === "Release decision" || section === "发布结论" ? "发布已阻塞：2 个新增硬门槛失败需要修复证据链。" : "根据当前具有明确数据水位的分析上下文生成。"}</p></div></li>)}</ol>
        </div>}
      </Drawer>
    </div>
  );
}
