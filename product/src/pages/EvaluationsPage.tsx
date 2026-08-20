import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Progress, Select, Space, Tag } from "antd";
import { EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvaluationSummary } from "../types";
import { compactTime, displayValue, readinessName, riskName, scoreStatusName, trackName, verdictName } from "../utils/format";

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
    { title: "评价编号", dataIndex: "evaluationId", fixed: "left", width: 160, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{row.evaluationId}</button> },
    { title: "测试用例", dataIndex: "caseId", width: 180, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "分轨", dataIndex: "track", width: 105, render: (_, row) => trackName(row.track) },
    { title: "风险", dataIndex: "risk", width: 95, render: (_, row) => <Tag color={row.risk === "critical" ? "red" : row.risk === "high" ? "orange" : "blue"}>{riskName(row.risk)}</Tag> },
    { title: "就绪状态", dataIndex: "readiness", width: 110, render: (_, row) => <Tag color={row.readiness === "ready" ? "green" : "gold"}>{readinessName(row.readiness)}</Tag> },
    { title: "评价结论", dataIndex: "verdict", width: 150, render: (_, row) => <Tag color={row.verdict === "HG" ? "red" : row.verdict === "A" ? "green" : row.verdict === "—" ? "default" : "gold"}>{verdictName(row.verdict)}</Tag> },
    { title: "质量得分", dataIndex: "qualityScore", width: 115, render: (_, row) => row.qualityScore == null ? "—" : <Progress percent={row.qualityScore} size="small" strokeColor={row.qualityScore < 60 ? "#ef4444" : row.qualityScore < 80 ? "#f5b942" : "#28c76f"} format={() => displayValue(row.qualityScore)} /> },
    { title: "失败门槛", dataIndex: "failedGates", width: 150, render: (_, row) => row.failedGates.length ? row.failedGates.map((item) => <Tag color="red" key={item}>{item}</Tag>) : "—" },
    { title: "评分状态", dataIndex: "scoreStatus", width: 115, render: (_, row) => <Tag color={row.scoreStatus === "formal" ? "green" : row.scoreStatus === "diagnostic" ? "purple" : "default"}>{scoreStatusName(row.scoreStatus)}</Tag> },
    { title: "证据包", dataIndex: "bundleId", width: 190, render: (_, row) => row.bundleId ? <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)}>{row.bundleId}</button> : "—" },
    { title: "完成时间", dataIndex: "completedAt", width: 145, render: (_, row) => compactTime(row.completedAt) },
    { title: "", valueType: "option", fixed: "right", width: 58, render: (_, row) => <Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.evaluationId}`} onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)} /> },
  ];

  return (
    <div className="standard-page evaluations-page">
      <PageHeader title="评价结果浏览器" subtitle="按就绪状态、评价结论、硬门槛与风险定位正式评价；未就绪结果不会被显示为 0 分。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      <div className="collection-stat-grid">
        <SectionCard><span>结果总数</span><strong>{data.length}</strong><small>当前查询结果</small></SectionCard>
        <SectionCard><span>正式评分</span><strong>{formal}</strong><small>已形成正式得分</small></SectionCard>
        <SectionCard><span>评价已就绪</span><strong>{ready}</strong><small>证据已解析</small></SectionCard>
        <SectionCard className={blocked ? "collection-stat-danger" : ""}><span>硬门槛阻塞</span><strong>{blocked}</strong><small>需要评审</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="评价编号 / 用例编号" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={track} options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({ value, label: trackName(value) }))} onChange={(value) => setQuery({ track: value })} />
          <Select value={risk} options={["all", "critical", "high", "medium", "low"].map((value) => ({ value, label: riskName(value) }))} onChange={(value) => setQuery({ risk: value })} />
          <Select value={readiness} options={[{ value: "all", label: "全部就绪状态" }, { value: "ready", label: readinessName("ready") }, { value: "not_ready", label: readinessName("not_ready") }]} onChange={(value) => setQuery({ readiness: value })} />
          <Select value={verdict} options={["all", "HG", "A", "B", "C", "—"].map((value) => ({ value, label: value === "all" ? "全部评价结论" : verdictName(value) }))} onChange={(value) => setQuery({ verdict: value })} />
          <Button onClick={() => navigateWithContext("/evaluations", { search: undefined, track: "all", risk: "all", readiness: "all", verdict: "all" })}>清除</Button>
        </div>
        {(search || readiness !== "all" || verdict !== "all") && <Space className="active-filter-summary"><span>当前筛选：</span>{search && <Tag>搜索：{search}</Tag>}{readiness !== "all" && <Tag color="blue">就绪状态：{readinessName(readiness)}</Tag>}{verdict !== "all" && <Tag color="gold">评价结论：{verdictName(verdict)}</Tag>}</Space>}
        <ProTable<EvaluationSummary> rowKey="evaluationId" columns={columns} dataSource={data} loading={query.isLoading} search={false} options={false} toolBarRender={false} scroll={{ x: 1500 }} pagination={{ pageSize: 12, showSizeChanger: false }} rowClassName={(row) => row.failedGates.length ? "critical-table-row" : ""} />
      </SectionCard>
    </div>
  );
}
