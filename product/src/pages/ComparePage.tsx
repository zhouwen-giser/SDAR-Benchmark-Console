import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Segmented, Table, Tag } from "antd";
import { DiffOutlined, EyeOutlined, SwapOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { ComparisonCase } from "../types";
import { changeName, displayValue, riskName, signedDelta, trackName, verdictName } from "../utils/format";

const changeColor: Record<string, string> = {
  NEW_FATAL: "magenta",
  NEW_GATE_FAILURE: "red",
  REGRESSED: "volcano",
  RECOVERED: "green",
  IMPROVED: "cyan",
  UNCHANGED: "default",
};

function numeric(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function ComparePage() {
  const { comparisonId = "CMP-20260815-004" } = useParams();
  const { searchParams, navigateWithContext } = useAnalysisContext();
  const filter = searchParams.get("changeType") ?? "ALL";
  const query = useQuery({ queryKey: ["comparison", comparisonId], queryFn: () => consoleApi.getComparison(comparisonId) });
  const data = query.data?.data;
  const filteredCases = useMemo(() => {
    if (!data || filter === "ALL") return data?.cases ?? [];
    if (filter === "REGRESSED_AND_NEW_GATE") return data.cases.filter((item) => item.change === "REGRESSED" || item.change === "NEW_GATE_FAILURE");
    return data.cases.filter((item) => item.change === filter);
  }, [data, filter]);

  if (!data || !query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载版本比较快照…</div></SectionCard></div>;
  const baselineScore = numeric(data.baseline.score);
  const candidateScore = numeric(data.candidate.score);
  const baselinePass = numeric(data.baseline.passRate);
  const candidatePass = numeric(data.candidate.passRate);
  const caseMeta = capabilityMeta("comparisonCases", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });

  const columns = [
    { title: "测试用例", dataIndex: "caseId", key: "caseId", fixed: "left" as const, width: 165, render: (value: string, row: ComparisonCase) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{value}</button> },
    { title: "分轨", dataIndex: "track", key: "track", width: 105, render: (value: string) => trackName(value) },
    { title: "风险", dataIndex: "risk", key: "risk", width: 95, render: (value: string) => <Tag color={value === "critical" ? "red" : "orange"}>{riskName(value)}</Tag> },
    { title: "基准版本", key: "baseline", width: 175, render: (_: unknown, row: ComparisonCase) => <span>{verdictName(row.baselineVerdict)} · {displayValue(row.baselineScore)}</span> },
    { title: "候选版本", key: "candidate", width: 175, render: (_: unknown, row: ComparisonCase) => <span className={row.candidateVerdict === "HG" ? "text-danger" : ""}>{verdictName(row.candidateVerdict)} · {displayValue(row.candidateScore)}</span> },
    { title: "得分变化", key: "delta", width: 100, sorter: (a: ComparisonCase, b: ComparisonCase) => numeric(a.candidateScore) - numeric(a.baselineScore) - (numeric(b.candidateScore) - numeric(b.baselineScore)), render: (_: unknown, row: ComparisonCase) => row.baselineScore == null || row.candidateScore == null ? "—" : <span className={row.candidateScore - row.baselineScore < 0 ? "text-danger" : "text-positive"}>{signedDelta(row.candidateScore - row.baselineScore)}</span> },
    { title: "变化类型", dataIndex: "change", key: "change", width: 165, render: (value: string) => <Tag color={changeColor[value]}>{changeName(value)}</Tag> },
    { title: "变化指标 / 门槛", dataIndex: "changed", key: "changed", render: (value: string[]) => value.map((item) => <Tag key={item} color={item.startsWith("HG") ? "red" : "blue"}>{item === "readiness" ? "就绪状态" : item}</Tag>) },
    { title: "证据差异", key: "evidence", fixed: "right" as const, width: 125, render: (_: unknown, row: ComparisonCase) => row.candidateBundleId ? <Button icon={<DiffOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${row.candidateBundleId}`, { tab: "diff", baselineBundleId: row.baselineBundleId })}>查看差异</Button> : <span className="text-muted">—</span> },
  ];

  return (
    <div className="standard-page compare-page">
      <PageHeader
        title="基准版本与候选版本比较"
        subtitle={`${String(data.baseline.candidate)} → ${String(data.candidate.candidate)} · ${comparisonId}`}
        meta={query.data.meta}
        actions={<Button icon={<EyeOutlined />} onClick={() => navigateWithContext("/overview")}>返回总览</Button>}
      />
      <Alert className="compatibility-alert" type="success" showIcon message="可以比较" description="数据集 release-v0.1、评价配置 sdar-v2-review-2.1 与证据合同 0.1.0 均兼容。" />
      <div className="compare-summary">
        <SectionCard className="compare-identity baseline-identity"><span>基准版本</span><b>{String(data.baseline.candidate)}</b><small>{String(data.baseline.runId)}</small></SectionCard>
        <div className="compare-swap"><SwapOutlined /></div>
        <SectionCard className="compare-identity candidate-identity"><span>候选版本</span><b>{String(data.candidate.candidate)}</b><small>{String(data.candidate.runId)}</small></SectionCard>
        {[
          ["得分变化", signedDelta(candidateScore - baselineScore)],
          ["通过率变化", signedDelta(Number((candidatePass - baselinePass).toFixed(1)), "%")],
          ["新增致命问题", data.summary.newFatal],
          ["新增硬门槛失败", data.summary.newGateFailure],
          ["发生回归", data.summary.regressed],
          ["已恢复", data.summary.recovered],
        ].map(([label, value]) => <SectionCard key={String(label)} className="compare-stat"><span>{label}</span><strong className={label === "新增硬门槛失败" && Number(value) > 0 ? "text-danger" : ""}>{value}</strong></SectionCard>)}
      </div>
      <SectionCard
        title="回归问题浏览器"
        extra={<ApiStatusTag compact meta={caseMeta} />}
        className="table-card regression-explorer"
      >
        <div className="regression-toolbar">
          <Segmented
            value={filter}
            options={[
              { label: "全部", value: "ALL" },
              { label: `发生回归（${data.summary.regressed}）`, value: "REGRESSED" },
              { label: `新增硬门槛失败（${data.summary.newGateFailure}）`, value: "NEW_GATE_FAILURE" },
              { label: "回归或新增硬门槛失败", value: "REGRESSED_AND_NEW_GATE" },
              { label: `已恢复（${data.summary.recovered}）`, value: "RECOVERED" },
            ]}
            onChange={(value) => navigateWithContext(`/compare/${comparisonId}`, { changeType: String(value) })}
          />
          <span>默认排序：新增致命问题 → 新增硬门槛失败 → 极高风险回归 → 最大负向变化</span>
        </div>
        <Table<ComparisonCase>
          rowKey="caseId"
          columns={columns}
          dataSource={filteredCases}
          pagination={false}
          scroll={{ x: 1420 }}
          rowClassName={(row) => row.change === "NEW_GATE_FAILURE" ? "critical-table-row" : ""}
        />
      </SectionCard>
    </div>
  );
}
