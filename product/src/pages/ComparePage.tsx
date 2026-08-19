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
import { displayValue, signedDelta } from "../utils/format";

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

  if (!data || !query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 Comparison Snapshot…</div></SectionCard></div>;
  const baselineScore = numeric(data.baseline.score);
  const candidateScore = numeric(data.candidate.score);
  const baselinePass = numeric(data.baseline.passRate);
  const candidatePass = numeric(data.candidate.passRate);
  const caseMeta = capabilityMeta("comparisonCases", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });

  const columns = [
    { title: "Case", dataIndex: "caseId", key: "caseId", fixed: "left" as const, width: 165, render: (value: string, row: ComparisonCase) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{value}</button> },
    { title: "Track", dataIndex: "track", key: "track", width: 85 },
    { title: "Risk", dataIndex: "risk", key: "risk", width: 95, render: (value: string) => <Tag color={value === "critical" ? "red" : "orange"}>{value}</Tag> },
    { title: "Baseline", key: "baseline", width: 130, render: (_: unknown, row: ComparisonCase) => <span>{row.baselineVerdict} · {displayValue(row.baselineScore)}</span> },
    { title: "Candidate", key: "candidate", width: 130, render: (_: unknown, row: ComparisonCase) => <span className={row.candidateVerdict === "HG" ? "text-danger" : ""}>{row.candidateVerdict} · {displayValue(row.candidateScore)}</span> },
    { title: "Δ Score", key: "delta", width: 95, sorter: (a: ComparisonCase, b: ComparisonCase) => numeric(a.candidateScore) - numeric(a.baselineScore) - (numeric(b.candidateScore) - numeric(b.baselineScore)), render: (_: unknown, row: ComparisonCase) => row.baselineScore == null || row.candidateScore == null ? "—" : <span className={row.candidateScore - row.baselineScore < 0 ? "text-danger" : "text-positive"}>{signedDelta(row.candidateScore - row.baselineScore)}</span> },
    { title: "Change", dataIndex: "change", key: "change", width: 165, render: (value: string) => <Tag color={changeColor[value]}>{value}</Tag> },
    { title: "Changed Metrics / Gates", dataIndex: "changed", key: "changed", render: (value: string[]) => value.map((item) => <Tag key={item} color={item.startsWith("HG") ? "red" : "blue"}>{item}</Tag>) },
    { title: "Evidence", key: "evidence", fixed: "right" as const, width: 125, render: (_: unknown, row: ComparisonCase) => row.candidateBundleId ? <Button icon={<DiffOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${row.candidateBundleId}`, { tab: "diff", baselineBundleId: row.baselineBundleId })}>Diff</Button> : <span className="text-muted">—</span> },
  ];

  return (
    <div className="standard-page compare-page">
      <PageHeader
        title="Baseline vs Candidate Compare"
        subtitle={`${String(data.baseline.candidate)} → ${String(data.candidate.candidate)} · ${comparisonId}`}
        meta={query.data.meta}
        actions={<Button icon={<EyeOutlined />} onClick={() => navigateWithContext("/overview")}>返回总览</Button>}
      />
      <Alert className="compatibility-alert" type="success" showIcon message="COMPARABLE" description="Dataset release-v0.1 · Profile sdar-v2-review-2.1 · Evidence Contract 0.1.0 均兼容" />
      <div className="compare-summary">
        <SectionCard className="compare-identity baseline-identity"><span>BASELINE</span><b>{String(data.baseline.candidate)}</b><small>{String(data.baseline.runId)}</small></SectionCard>
        <div className="compare-swap"><SwapOutlined /></div>
        <SectionCard className="compare-identity candidate-identity"><span>CANDIDATE</span><b>{String(data.candidate.candidate)}</b><small>{String(data.candidate.runId)}</small></SectionCard>
        {[
          ["Δ Score", signedDelta(candidateScore - baselineScore)],
          ["Δ Pass", signedDelta(Number((candidatePass - baselinePass).toFixed(1)), "%")],
          ["New Fatal", data.summary.newFatal],
          ["New HG", data.summary.newGateFailure],
          ["Regressed", data.summary.regressed],
          ["Recovered", data.summary.recovered],
        ].map(([label, value]) => <SectionCard key={String(label)} className="compare-stat"><span>{label}</span><strong className={label === "New HG" && Number(value) > 0 ? "text-danger" : ""}>{value}</strong></SectionCard>)}
      </div>
      <SectionCard
        title="Regression Explorer"
        extra={<ApiStatusTag compact meta={caseMeta} />}
        className="table-card regression-explorer"
      >
        <div className="regression-toolbar">
          <Segmented
            value={filter}
            options={[
              { label: "ALL", value: "ALL" },
              { label: `REGRESSED (${data.summary.regressed})`, value: "REGRESSED" },
              { label: `NEW GATE FAILURE (${data.summary.newGateFailure})`, value: "NEW_GATE_FAILURE" },
              { label: "REGRESSED + NEW HG", value: "REGRESSED_AND_NEW_GATE" },
              { label: `RECOVERED (${data.summary.recovered})`, value: "RECOVERED" },
            ]}
            onChange={(value) => navigateWithContext(`/compare/${comparisonId}`, { changeType: String(value) })}
          />
          <span>默认排序：New Fatal → New HG → Critical Regressed → 最大负 Delta</span>
        </div>
        <Table<ComparisonCase>
          rowKey="caseId"
          columns={columns}
          dataSource={filteredCases}
          pagination={false}
          scroll={{ x: 1280 }}
          rowClassName={(row) => row.change === "NEW_GATE_FAILURE" ? "critical-table-row" : ""}
        />
      </SectionCard>
    </div>
  );
}
