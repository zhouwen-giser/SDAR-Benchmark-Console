import { useState } from "react";
import { Alert, Button, Collapse, Descriptions, Space, Table, Tag } from "antd";
import type { ObservedEvaluation } from "../types";
import { coverageText, formatFraction, limitationLabels, observedScoreText, observedStatusLabels } from "../utils/observedEvaluation";
import { SectionCard } from "./common";

export function ObservedStatus({ value }: { value: ObservedEvaluation["scoreStatus"] }) {
  return <Tag color={value === "INVALID_INPUT" ? "orange" : value === "PARTIAL_SCORED" ? "gold" : value === "SCORED" ? "blue" : "default"}>{observedStatusLabels[value]} · {value}</Tag>;
}

export function ObservedEvaluationPanel({ value, secondary = false }: { value: ObservedEvaluation; secondary?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return <section className="observed-evaluation" aria-label={secondary ? "M 指标观察评测" : "普通评测"}>
    <div className="observed-policy"><Tag>{secondary ? "M 指标观察结果（独立于普通 Case）" : "普通评测"}</Tag><code>{value.evaluationPolicyRef.id}/{value.evaluationPolicyRef.version}</code><span>成绩、覆盖率、任务结果与正式资格分别展示</span></div>
    <div className="observed-hero">
      <SectionCard><span>可观察评分 · Observed Score</span><strong data-testid="observed-score">{observedScoreText(value)}</strong><small>仅代表已有充分证据的指标，不代表总体通过</small></SectionCard>
      <SectionCard><span>评价覆盖率 · Coverage</span><strong data-testid="observed-coverage">{coverageText(value.coverage)}</strong><small>{value.scoredWeight} / {value.applicableWeight} 权重</small><small>{value.scoredMetrics.length} / {value.applicableMetrics.length} 指标</small></SectionCard>
      <SectionCard><span>普通评价状态</span><ObservedStatus value={value.scoreStatus} /><div>任务结果 · <b>{value.taskOutcome}</b></div><small>正式资格 · <Tag>{value.formalQualification.status}</Tag></small><small>{value.formalQualification.reason}</small></SectionCard>
    </div>
    <Alert type="info" showIcon message="分数不等于任务成功" description="Coverage 是适用权重中的已评分比例，不是成功概率或安全覆盖率；普通评分不参与正式排名。正式资格未授予不代表普通评分失败。" />
    <SectionCard title={secondary ? "M1–M15 · evidence-aware 指标（不替代 Case 规则）" : "M1–M15 · 普通评测指标"} className="observed-metrics">
      <Table<ObservedEvaluation["metrics"][number]> rowKey="metricId" size="small" pagination={false} dataSource={value.metrics} scroll={{ x: 850 }} columns={[
        { title: "指标", dataIndex: "metricId", width: 75 },
        { title: "状态", dataIndex: "status", width: 220, render: (status: string) => <Tag color={status === "SCORED" ? "blue" : status === "BLOCKED" ? "orange" : "default"}>{status} · {status === "SCORED" ? "已评分" : status === "UNKNOWN" ? "数据不足" : status === "BLOCKED" ? "局部阻塞" : "不适用"}</Tag> },
        { title: "0/1/2 得分", width: 100, render: (_, row) => <span data-testid={`observed-raw-${row.metricId}`}>{row.status === "SCORED" && row.rawScore != null ? row.rawScore : "—"}</span> },
        { title: "权重", dataIndex: "weight", width: 70 },
        { title: "reasonCodes", dataIndex: "reasonCodes", render: (reasons: string[]) => <div className="observed-codes">{reasons.length ? reasons.map((reason) => <code key={reason}>{reason}</code>) : "—"}</div> },
        { title: "evidenceRefs 数量", width: 130, render: (_, row) => row.evidenceRefs.length },
      ]} />
    </SectionCard>
    <SectionCard title="数据限制 / Evaluation Limitations">
      {value.limitations.length === 0 ? <span>服务端未返回限制项</span> : <ul className="observed-limitations">{(expanded ? value.limitations : value.limitations.slice(0, 4)).map((reason) => <li key={reason}><code>{reason}</code>{limitationLabels[reason] && <span> — {limitationLabels[reason]}</span>}</li>)}</ul>}
      {value.limitations.length > 4 && <Button type="link" onClick={() => setExpanded(!expanded)}>{expanded ? "收起限制" : `展开全部 ${value.limitations.length} 条限制`}</Button>}
    </SectionCard>
    <Collapse items={[
      { key: "dimensions", label: "普通评分维度（非严格五维）", children: <Table rowKey="id" size="small" pagination={false} dataSource={Object.entries(value.dimensions ?? {}).map(([id, data]) => ({ id, ...data }))} columns={[
        { title: "维度", dataIndex: "id" }, { title: "Observed Score", render: (_, row) => formatFraction(row.observedScore) },
        { title: "Coverage", render: (_, row) => coverageText(row.coverage) }, { title: "已评分 / 适用权重", render: (_, row) => `${row.scoredWeight} / ${row.applicableWeight}` },
      ]} /> },
      { key: "findings", label: `普通评测发现（${value.findings.length}）与政策`, children: <><Descriptions column={1} items={[
        { key: "policy", label: "Policy hash", children: value.evaluationPolicyRef.contentHash },
        { key: "comparison", label: "Comparison key（不用于本页排名）", children: value.comparisonKey },
      ]} /><Table rowKey="ruleId" pagination={false} size="small" dataSource={value.findings} columns={[
        { title: "规则", dataIndex: "ruleId" }, { title: "结果", dataIndex: "result" },
        { title: "原因", render: (_, row) => <Space wrap>{row.reasonCodes.map((reason) => <Tag key={reason}>{reason}</Tag>)}</Space> },
        { title: "证据数量", render: (_, row) => row.evidenceRefs.length },
      ]} /></> },
    ]} />
  </section>;
}
