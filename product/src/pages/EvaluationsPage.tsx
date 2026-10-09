import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Alert, Button, Input, Progress, Select, Space, Tag } from "antd";
import { EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { ObservedStatus } from "../components/ObservedEvaluationPanel";
import { CaseVerdict } from "../components/CaseDiagnosticEvaluationPanel";
import { coverageText, evaluationScoreText, observedScoreText } from "../utils/observedEvaluation";
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
    { title: "普通 Case 分数", key: "caseScore", width: 120, render: (_, row) => row.caseDiagnosticEvaluation ? <span className="observed-list-score">{evaluationScoreText(row.caseDiagnosticEvaluation.resultStatus, row.caseDiagnosticEvaluation.ruleScore, row.caseDiagnosticEvaluation.displayScore)}</span> : "—" },
    { title: "Case 覆盖率", key: "caseCoverage", width: 140, render: (_, row) => row.caseDiagnosticEvaluation ? <><Tag>覆盖 {coverageText(row.caseDiagnosticEvaluation.coverage)}</Tag><br /><small>{row.caseDiagnosticEvaluation.scoredCount}/{row.caseDiagnosticEvaluation.applicableCount} 可判 · {row.caseDiagnosticEvaluation.notApplicableCount} N/A</small></> : "—" },
    { title: "普通 Case 结论 / 政策", key: "caseVerdict", width: 160, render: (_, row) => row.caseDiagnosticEvaluation ? <><CaseVerdict value={row.caseDiagnosticEvaluation.caseVerdict} /><br /><small>policy/{row.caseDiagnosticEvaluation.policyRef.version} · {row.caseDiagnosticEvaluation.resultStatus}</small></> : "—" },
    { title: "M 指标 Observed Score", key: "observedScore", width: 145, render: (_, row) => row.observedEvaluation ? <span className="observed-list-score">{observedScoreText(row.observedEvaluation)}</span> : "—" },
    { title: "M 指标 Coverage", key: "coverage", width: 130, render: (_, row) => row.observedEvaluation ? <Tag color={row.observedEvaluation.scoreStatus === "PARTIAL_SCORED" ? "gold" : "default"}>覆盖 {coverageText(row.observedEvaluation.coverage)}</Tag> : "—" },
    { title: "M 指标评分状态", key: "observedStatus", width: 255, render: (_, row) => row.observedEvaluation ? <ObservedStatus value={row.observedEvaluation.scoreStatus} /> : "—" },
    { title: "测试用例", dataIndex: "caseId", width: 180, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "分轨", dataIndex: "track", width: 105, render: (_, row) => trackName(row.track) },
    { title: "风险", dataIndex: "risk", width: 95, render: (_, row) => <Tag color={row.risk === "critical" ? "red" : row.risk === "high" ? "orange" : "blue"}>{riskName(row.risk)}</Tag> },
    { title: "就绪状态", dataIndex: "readiness", width: 110, render: (_, row) => <Tag color={row.readiness === "ready" ? "green" : "gold"}>{readinessName(row.readiness)}</Tag> },
    { title: "严格评价结论", dataIndex: "verdict", width: 150, render: (_, row) => <Tag color={row.verdict === "HG" ? "red" : row.verdict === "A" ? "green" : row.verdict === "—" ? "default" : "gold"}>{verdictName(row.verdict)}</Tag> },
    { title: "严格评分", dataIndex: "qualityScore", width: 115, render: (_, row) => row.qualityScore == null ? "—" : <Progress percent={row.qualityScore} size="small" strokeColor={row.qualityScore < 60 ? "#ef4444" : row.qualityScore < 80 ? "#f5b942" : "#28c76f"} format={() => displayValue(row.qualityScore)} /> },
    { title: "失败门槛", dataIndex: "failedGates", width: 150, render: (_, row) => row.failedGates.length ? row.failedGates.map((item) => <Tag color="red" key={item}>{item}</Tag>) : "—" },
    { title: "严格评分状态", dataIndex: "scoreStatus", width: 115, render: (_, row) => <Tag color={row.scoreStatus === "formal" ? "green" : row.scoreStatus === "diagnostic" ? "purple" : "default"}>{scoreStatusName(row.scoreStatus)}</Tag> },
    { title: "证据包", dataIndex: "bundleId", width: 190, render: (_, row) => row.bundleId ? <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)}>{row.bundleId}</button> : "—" },
    { title: "完成时间", dataIndex: "completedAt", width: 145, render: (_, row) => compactTime(row.completedAt) },
    { title: "", valueType: "option", fixed: "right", width: 58, render: (_, row) => <Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.evaluationId}`} onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)} /> },
  ];

  return (
    <div className="standard-page evaluations-page">
      <PageHeader title="评价结果浏览器" subtitle="普通 Case 分数、Case 覆盖率与 M 指标分开显示；Case PASS 不代表 Candidate 物理成功或正式资格通过。严格评分独立保留。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      {query.isError && <Alert type="error" showIcon message="评价列表读取失败" description={query.error.message} />}
      <div className="collection-stat-grid">
        <SectionCard><span>结果总数</span><strong>{data.length}</strong><small>当前查询结果</small></SectionCard>
        <SectionCard><span>正式评分</span><strong>{formal}</strong><small>已形成正式得分</small></SectionCard>
        <SectionCard><span>严格评价已就绪</span><strong>{ready}</strong><small>证据已解析</small></SectionCard>
        <SectionCard className={blocked ? "collection-stat-danger" : ""}><span>严格硬门槛阻塞</span><strong>{blocked}</strong><small>需要评审</small></SectionCard>
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
        <ProTable<EvaluationSummary> rowKey="evaluationId" columns={columns} dataSource={data} loading={query.isLoading} search={false} options={false} toolBarRender={false} scroll={{ x: 2470 }} pagination={{ pageSize: 12, showSizeChanger: false }} rowClassName={(row) => !row.observedEvaluation && !row.caseDiagnosticEvaluation && row.failedGates.length ? "critical-table-row" : ""} />
      </SectionCard>
    </div>
  );
}
