import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Progress, Select, Space, Tag } from "antd";
import { EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvaluationSummary } from "../types";
import { compactTime, displayValue } from "../utils/format";

export function EvaluationsPage() {
  const { searchParams, navigateWithContext } = useAnalysisContext();
  const track = searchParams.get("track") ?? "all";
  const risk = searchParams.get("risk") ?? "all";
  const readiness = searchParams.get("readiness") ?? "all";
  const verdict = searchParams.get("verdict") ?? "all";
  const search = searchParams.get("search") ?? undefined;
  const query = useQuery({
    queryKey: ["evaluations", track, risk, readiness, verdict, search],
    queryFn: () => consoleApi.listEvaluations({ track, risk, readiness, verdict, search }),
  });
  const data = query.data?.data ?? [];
  const all = query.data ? query.data.data : [];
  const formal = all.filter((item) => item.scoreStatus === "formal").length;
  const blocked = all.filter((item) => item.failedGates.length > 0).length;
  const ready = all.filter((item) => item.readiness === "ready").length;
  const setQuery = (patch: Record<string, string | undefined>) => navigateWithContext("/evaluations", patch);

  const columns: ProColumns<EvaluationSummary>[] = [
    { title: "Evaluation ID", dataIndex: "evaluationId", fixed: "left", width: 160, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{row.evaluationId}</button> },
    { title: "Case", dataIndex: "caseId", width: 180, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "Track", dataIndex: "track", width: 80 },
    { title: "Risk", dataIndex: "risk", width: 95, render: (_, row) => <Tag color={row.risk === "critical" ? "red" : row.risk === "high" ? "orange" : "blue"}>{row.risk}</Tag> },
    { title: "Readiness", dataIndex: "readiness", width: 110, render: (_, row) => <Tag color={row.readiness === "ready" ? "green" : "gold"}>{row.readiness}</Tag> },
    { title: "Verdict", dataIndex: "verdict", width: 82, render: (_, row) => <Tag color={row.verdict === "HG" ? "red" : row.verdict === "A" ? "green" : row.verdict === "—" ? "default" : "gold"}>{row.verdict}</Tag> },
    { title: "Quality", dataIndex: "qualityScore", width: 115, render: (_, row) => row.qualityScore == null ? "—" : <Progress percent={row.qualityScore} size="small" strokeColor={row.qualityScore < 60 ? "#ef4444" : row.qualityScore < 80 ? "#f5b942" : "#28c76f"} format={() => displayValue(row.qualityScore)} /> },
    { title: "Failed Gates", dataIndex: "failedGates", width: 150, render: (_, row) => row.failedGates.length ? row.failedGates.map((item) => <Tag color="red" key={item}>{item}</Tag>) : "—" },
    { title: "Score Status", dataIndex: "scoreStatus", width: 115, render: (_, row) => <Tag color={row.scoreStatus === "formal" ? "green" : row.scoreStatus === "diagnostic" ? "purple" : "default"}>{row.scoreStatus}</Tag> },
    { title: "Bundle", dataIndex: "bundleId", width: 190, render: (_, row) => row.bundleId ? <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)}>{row.bundleId}</button> : "—" },
    { title: "Completed", dataIndex: "completedAt", width: 145, render: (_, row) => compactTime(row.completedAt) },
    { title: "", valueType: "option", fixed: "right", width: 58, render: (_, row) => <Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.evaluationId}`} onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)} /> },
  ];

  return (
    <div className="standard-page evaluations-page">
      <PageHeader title="Evaluation Explorer" subtitle="按 Readiness、Verdict、Gate 与风险定位正式评价；NR 不会被显示为 0 分。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      <div className="collection-stat-grid">
        <SectionCard><span>TOTAL RESULTS</span><strong>{data.length}</strong><small>current query</small></SectionCard>
        <SectionCard><span>FORMAL</span><strong>{formal}</strong><small>scored results</small></SectionCard>
        <SectionCard><span>EVALUATION READY</span><strong>{ready}</strong><small>evidence resolved</small></SectionCard>
        <SectionCard className={blocked ? "collection-stat-danger" : ""}><span>GATE BLOCKED</span><strong>{blocked}</strong><small>requires review</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="Evaluation / Case ID" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={track} options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({ value, label: value === "all" ? "全部 Track" : value.toUpperCase() }))} onChange={(value) => setQuery({ track: value })} />
          <Select value={risk} options={["all", "critical", "high", "medium", "low"].map((value) => ({ value, label: value === "all" ? "全部 Risk" : value }))} onChange={(value) => setQuery({ risk: value })} />
          <Select value={readiness} options={[{ value: "all", label: "全部 Readiness" }, { value: "ready", label: "Ready" }, { value: "not_ready", label: "Not Ready" }]} onChange={(value) => setQuery({ readiness: value })} />
          <Select value={verdict} options={["all", "HG", "A", "B", "C", "—"].map((value) => ({ value, label: value === "all" ? "全部 Verdict" : value }))} onChange={(value) => setQuery({ verdict: value })} />
          <Button onClick={() => navigateWithContext("/evaluations", { search: undefined, track: "all", risk: "all", readiness: "all", verdict: "all" })}>清除</Button>
        </div>
        {(search || readiness !== "all" || verdict !== "all") && <Space className="active-filter-summary"><span>当前过滤：</span>{search && <Tag>Search={search}</Tag>}{readiness !== "all" && <Tag color="blue">Readiness={readiness}</Tag>}{verdict !== "all" && <Tag color="gold">Verdict={verdict}</Tag>}</Space>}
        <ProTable<EvaluationSummary> rowKey="evaluationId" columns={columns} dataSource={data} loading={query.isLoading} search={false} options={false} toolBarRender={false} scroll={{ x: 1500 }} pagination={{ pageSize: 12, showSizeChanger: false }} rowClassName={(row) => row.failedGates.length ? "critical-table-row" : ""} />
      </SectionCard>
    </div>
  );
}
