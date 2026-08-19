import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Input, Select, Space, Table, Tag, message } from "antd";
import { EyeOutlined, FileTextOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { ReportRecord } from "../types";
import { compactTime } from "../utils/format";

const typeLabel: Record<ReportRecord["type"], string> = {
  release_review: "Release Review",
  regression_digest: "Regression Digest",
  evidence_audit: "Evidence Audit",
};

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
      title: `Candidate ${filters.candidateId} Release Review`,
      type: "release_review",
      status: "draft",
      scope: `${filters.runId} · ${filters.datasetVersion}`,
      format: "Markdown",
      sections: ["Release decision", "Quality summary", "Blocking cases", "Evidence audit", "Recommended actions"],
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
      note: "Session-local export generated from deterministic Mock Snapshot.",
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
    { title: "Report ID", dataIndex: "reportId", key: "reportId", width: 160, render: (value: string, row: ReportRecord) => <button className="link-button" onClick={() => setSelected(row)}>{value}</button> },
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Type", dataIndex: "type", key: "type", width: 165, render: (value: ReportRecord["type"]) => typeLabel[value] },
    { title: "Status", dataIndex: "status", key: "status", width: 100, render: (value: string) => <Tag color={value === "ready" ? "green" : "gold"}>{value}</Tag> },
    { title: "Scope", dataIndex: "scope", key: "scope", width: 235 },
    { title: "Format", dataIndex: "format", key: "format", width: 100 },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", width: 150, render: (value: string) => compactTime(value) },
    { title: "", key: "actions", width: 72, render: (_: unknown, row: ReportRecord) => <Button type="text" icon={<EyeOutlined />} aria-label={`预览 ${row.reportId}`} onClick={() => setSelected(row)} /> },
  ];

  return (
    <div className="standard-page reports-page">
      {contextHolder}
      <PageHeader title="Report Center" subtitle="生成可审阅的发布、回归与证据摘要；后端 Report Service 尚未实现。" meta={query.data?.meta} actions={<><Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button><Button type="primary" icon={<FileTextOutlined />} onClick={createDraft}>新建发布评审草稿</Button></>} />
      <div className="session-boundary-banner"><b>SESSION-LOCAL</b><span>新建草稿与预览不写入后端；离开页面或刷新后会丢失。已提供 JSON 下载用于交接。</span></div>
      <div className="collection-stat-grid">
        <SectionCard><span>AVAILABLE REPORTS</span><strong>{records.length}</strong><small>including session drafts</small></SectionCard>
        <SectionCard><span>READY</span><strong>{records.filter((item) => item.status === "ready").length}</strong><small>reviewable output</small></SectionCard>
        <SectionCard><span>DRAFT</span><strong>{records.filter((item) => item.status === "draft").length}</strong><small>not persisted</small></SectionCard>
        <SectionCard><span>EXPORT FORMAT</span><strong>JSON</strong><small>client-side</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search placeholder="Report ID / 标题 / Scope" allowClear onSearch={setSearch} />
          <Select value={type} options={[{ value: "all", label: "全部类型" }, { value: "release_review", label: "Release Review" }, { value: "regression_digest", label: "Regression Digest" }, { value: "evidence_audit", label: "Evidence Audit" }]} onChange={setType} />
          <Button onClick={() => { setType("all"); setSearch(""); }}>清除</Button>
        </div>
        <Table<ReportRecord> rowKey="reportId" columns={columns} dataSource={records} loading={query.isLoading} pagination={false} scroll={{ x: 1180 }} />
      </SectionCard>
      <Drawer title={`Report Preview · ${selected?.reportId ?? ""}`} width={760} open={Boolean(selected)} onClose={() => setSelected(null)} extra={selected && <Button type="primary" onClick={() => downloadJson(selected)}>下载 JSON</Button>}>
        {selected && <div className="report-preview">
          <div className="report-cover"><span>SDAR BENCHMARK</span><h2>{selected.title}</h2><p>{selected.scope}</p><Tag color={selected.status === "ready" ? "green" : "gold"}>{selected.status.toUpperCase()}</Tag></div>
          <Descriptions column={2} bordered size="small" items={[
            { key: "type", label: "Type", children: typeLabel[selected.type] },
            { key: "format", label: "Format", children: selected.format },
            { key: "created", label: "Created", children: selected.createdAt },
            { key: "by", label: "Created by", children: selected.createdBy },
          ]} />
          <h3>Sections</h3>
          <ol className="report-section-list">{selected.sections.map((section, index) => <li key={section}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{section}</b><p>{section === "Release decision" ? "BLOCKED · 2 new HG failures require evidence repair." : "Generated from the current watermarked analysis context."}</p></div></li>)}</ol>
        </div>}
      </Drawer>
    </div>
  );
}
