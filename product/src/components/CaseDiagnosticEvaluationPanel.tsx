import { Alert, Collapse, Descriptions, Space, Table, Tag } from "antd";
import type { CaseDiagnosticEvaluation, CaseDiagnosticRule, ObservableCaseDiagnosticRule, ObservedEvaluation } from "../types";
import { coverageText, evaluationScoreText, observedStatusLabels } from "../utils/observedEvaluation";
import { SectionCard } from "./common";

const ruleLabels: Record<CaseDiagnosticRule["result"], string> = {
  pass: "PASS", fail: "FAIL", insufficient_evidence: "UNKNOWN · 数据不足", not_applicable: "N/A",
};
const scopeLabels: Record<ObservableCaseDiagnosticRule["scope"], string> = {
  ARCHIVED_TASK_EXECUTION: "归档任务执行", RECORDED_PROVIDER_TASK: "已记录 Provider 任务", RECORDED_PHYSICAL_END_STATE: "已记录物理末态",
};
const codeList = (values: string[]) => values.length ? <ul className="observed-limitations">{values.map((value, index) => <li key={`${value}:${index}`}><code>{value}</code></li>)}</ul> : <span>—</span>;
const scalar = (value: number | null | undefined, suffix = "") => value == null ? "—" : `${value}${suffix}`;

export function CaseVerdict({ value }: { value: CaseDiagnosticEvaluation["caseVerdict"] }) {
  return <Tag color={value === "PASS" ? "green" : value === "FAIL" ? "red" : "gold"}>Case {value}</Tag>;
}

/** Rendering only: all scores, counters, rules and quality come from the Server. */
export function CaseDiagnosticEvaluationPanel({ value, observed, strictPassed }: {
  value: CaseDiagnosticEvaluation;
  observed?: ObservedEvaluation;
  strictPassed?: boolean | null;
}) {
  const v2 = value.schemaVersion === "sdar-benchmark.ugv-native-case-diagnostic-evaluation/2" ? value : undefined;
  const physical = v2?.observedPhysicalEndState;
  return <section className="observed-evaluation case-diagnostic-evaluation" aria-label="普通 Case 评测">
    <div className="observed-policy"><Tag color="blue">普通 Case 评测</Tag><code>{value.policyRef.id}/{value.policyRef.version}</code><span>{v2 ? "TASK_OBSERVABLE · 任务记录范围" : "v1 · 严格证据政策，未套用 v2 语义"}</span></div>
    <div className="observed-hero">
      <SectionCard><span>普通 Case 分数 · Rule Score</span><strong data-testid="case-score">{evaluationScoreText(value.resultStatus, value.ruleScore, value.displayScore)}</strong><small>{observedStatusLabels[value.resultStatus]} · {value.resultStatus}</small></SectionCard>
      <SectionCard><span>普通 Case 覆盖率 · Coverage</span><strong data-testid="case-coverage">{coverageText(value.coverage)}</strong><small>{value.scoredCount} / {value.applicableCount} 可判 · {value.notApplicableCount} N/A</small><small>{value.passCount} PASS · {value.failCount} FAIL · {value.insufficientCount} UNKNOWN</small></SectionCard>
      <SectionCard><span>普通 Case 结论</span><div data-testid="case-verdict"><CaseVerdict value={value.caseVerdict} /></div><small>Case {value.caseId}</small><small>仅当前 Case 政策，不替代 Candidate 结果或正式资格</small></SectionCard>
    </div>
    <SectionCard title="任务结果与正式资格（独立于 Case 分数）">
      <Descriptions size="small" column={3} items={[
        { key: "task", label: "Candidate 任务结果", children: <Tag data-testid="case-task-outcome">{observed?.taskOutcome ?? "unavailable"}</Tag> },
        { key: "formal", label: "正式资格", children: <Tag data-testid="case-formal-qualification">{observed?.formalQualification.status ?? "unavailable"}</Tag> },
        { key: "passed", label: "严格 passed", children: strictPassed == null ? "unavailable" : String(strictPassed) },
        { key: "eligible", label: "Case formalEligible", children: String(value.formalEligible) },
        { key: "ranking", label: "参与正式排名", children: String(value.rankingPermitted) },
        { key: "diagnostic", label: "diagnosticOnly", children: String(value.diagnosticOnly) },
      ]} />
    </SectionCard>
    <Alert type="info" showIcon message="Case PASS 不是 Candidate 物理成功或正式资格通过" description="Case 分数与覆盖率按服务端政策原样展示；证据质量和缺失证明独立披露，不重新乘权或调整分母。旧 M/F/HG 结果独立保留。" />
    {v2 && <SectionCard title="来源范围与证据质量（不影响普通 Case 计分）">
      <Descriptions size="small" column={2} items={[
        { key: "scope", label: "来源范围", children: <>{scopeLabels[v2.evidenceQuality.scope]} · <code>{v2.evidenceQuality.scope}</code></> },
        { key: "coverage", label: "观察范围", children: <>仅已记录材料 · <code>{v2.evidenceQuality.observationCoverage}</code></> },
        { key: "time", label: "时间基准", children: <Space wrap>{v2.evidenceQuality.timeBases.map((time) => <code key={time}>{time}</code>)}</Space> },
        { key: "accuracy", label: "精度依据", children: <>配置值，非实测 · <code>{v2.evidenceQuality.accuracyBasis}</code></> },
        { key: "independence", label: "来源独立性", span: 2, children: <>同源镜像不作为独立证据 · <code>{v2.evidenceQuality.sourceIndependence}</code></> },
      ]} />
    </SectionCard>}
    <SectionCard title={`普通 Case 规则 · ${value.rules.length} 项（${value.notApplicableCount} N/A）`}>
      <Table<CaseDiagnosticRule> rowKey="ruleId" size="small" pagination={false} dataSource={value.rules} scroll={{ x: v2 ? 960 : 750 }} columns={[
        { title: "Rule", dataIndex: "ruleId", width: 210 },
        { title: "结果", dataIndex: "result", width: 170, render: (result: CaseDiagnosticRule["result"]) => <Tag color={result === "pass" ? "blue" : result === "fail" ? "red" : "default"}>{ruleLabels[result]}</Tag> },
        ...(v2 ? [{ title: "观察范围 / 时钟", key: "scope", width: 205, render: (_: unknown, row: CaseDiagnosticRule) => { const rule = row as ObservableCaseDiagnosticRule; return <><span>{scopeLabels[rule.scope]}</span><br /><small>{rule.clockBasis ?? "时钟未指定"}</small></>; } }] : []),
        { title: "reasonCodes", dataIndex: "reasonCodes", render: (reasons: string[]) => <div className="observed-codes">{reasons.map((reason, index) => <code key={`${reason}:${index}`}>{reason}</code>)}</div> },
        { title: "证据数", width: 80, render: (_, row) => row.evidenceRefs.length },
      ]} expandable={{ expandedRowRender: (rule) => <Descriptions size="small" column={1} items={[
        { key: "status", label: "来源状态", children: rule.provenanceStatus },
        { key: "refs", label: "原始 evidenceRefs", children: codeList(rule.evidenceRefs) },
        { key: "missing", label: "缺失路径", children: codeList(rule.missingEvidencePaths) },
        ...(v2 ? [{ key: "quality", label: "规则质量限制", children: codeList((rule as ObservableCaseDiagnosticRule).limitations) }, { key: "confidence", label: "可信度依据", children: (rule as ObservableCaseDiagnosticRule).confidenceBasis }] : []),
      ]} /> }} />
    </SectionCard>
    <Collapse items={[
      ...(physical ? [{ key: "physical", label: "已记录物理末态（不等于 Agent 终态完成验证）", children: <Descriptions bordered size="small" column={2} items={[
        { key: "observed", label: "observedEndState", children: physical.observedEndState == null ? "UNKNOWN" : String(physical.observedEndState) },
        { key: "task", label: "taskAchievedAtTerminal", children: "UNKNOWN · null" },
        { key: "distance", label: "末端距离", children: scalar(physical.finalDistanceM, " m") },
        { key: "speed", label: "末端速度", children: scalar(physical.finalSpeedMps, " m/s") },
        { key: "dwell", label: "连续驻留", children: scalar(physical.dwellMs, " ms") },
        { key: "samples", label: "连续样本 / 总样本", children: `${scalar(physical.consecutiveSamples)} / ${physical.sampleCount}` },
        { key: "tolerance", label: "历史目标容差", children: scalar(physical.targetToleranceM, " m") },
        { key: "accuracy", label: "配置精度（非实测）", children: scalar(physical.configuredPositionAccuracyM, " m") },
        { key: "time", label: "时间基准 / 时钟域", children: `${physical.timeBasis ?? "—"} / ${physical.clockDomain ?? "—"}` },
        { key: "window", label: "记录窗口", children: `${physical.firstSampleAt ?? "—"} → ${physical.finalSampleAt ?? "—"}` },
        { key: "calibration", label: "历史校准 hash", span: 2, children: <code>{physical.calibrationHash ?? "—"}</code> },
      ]} /> }] : []),
      { key: "limitations", label: `数据限制（${value.limitations.length}）${v2 ? ` / 严格证明缺口（${v2.evidenceQuality.missingProofs.length}）` : " · v1"}`, children: <><h4>Case limitations</h4>{codeList(value.limitations)}{v2 && <><h4>Evidence quality limitations</h4>{codeList(v2.evidenceQuality.limitations)}<h4>Missing proofs</h4>{codeList(v2.evidenceQuality.missingProofs)}</>}</> },
      { key: "source", label: "政策、数据来源与原始绑定", children: <>
        <Descriptions size="small" column={1} items={[
          { key: "schema", label: "Schema", children: value.schemaVersion },
          { key: "policy", label: "Policy hash", children: <code>{value.policyRef.contentHash}</code> },
          { key: "rules", label: "RuleSet", children: <>{value.ruleSetRef.id}/{value.ruleSetRef.version}<br /><code>{value.ruleSetRef.contentHash}</code></> },
          { key: "dataset", label: "Dataset", children: `${value.datasetRef.id}/${value.datasetRef.version}` },
          { key: "source", label: "Source hash", children: <code>{value.sourceHash}</code> },
          { key: "input", label: "Scoring input hash", children: <code>{value.scoringInputHash}</code> },
        ]} />
        <Table rowKey={(row) => `${row.ruleId}:${row.targetPointer}`} pagination={{ pageSize: 8 }} size="small" dataSource={value.fields} scroll={{ x: 800 }} columns={[
          { title: "Rule", dataIndex: "ruleId", width: 220 }, { title: "字段路径", dataIndex: "targetPointer" }, { title: "状态", dataIndex: "status", width: 180 },
          { title: "源引用", render: (_, row) => <div className="observed-codes">{row.sourceRefs.map((ref, index) => <code key={`${ref.sourceRef}:${index}`}>{ref.originalSourcePointer}<br />{ref.originalHash}<br />{ref.clockBasis ?? "时钟未指定"}</code>)}</div> },
        ]} />
      </> },
    ]} />
  </section>;
}
