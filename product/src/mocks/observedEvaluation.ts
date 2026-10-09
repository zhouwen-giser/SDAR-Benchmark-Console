import type { ObservedEvaluation, EvaluationSummary } from "../types";

/** Frontend-only state example, not evidence of any real execution. */
export const mockObservedEvaluation: ObservedEvaluation = {
  schemaVersion: "sdar-benchmark.observed-evaluation/1",
  evaluationPolicyRef: { id: "evidence-aware", version: "1", contentHash: "mock-policy-hash" },
  observedScore: { numerator: "100", denominator: "1" }, displayScore: "100.000000",
  coverage: { numerator: "3", denominator: "50" }, scoreStatus: "PARTIAL_SCORED",
  applicableMetrics: Array.from({ length: 15 }, (_, i) => `M${i + 1}`), scoredMetrics: ["M1"],
  applicableWeight: 100, scoredWeight: 6,
  metrics: [6, 5, 7, 4, 6, 8, 6, 7, 8, 7, 8, 5, 8, 8, 7].map((weight, i) => ({
    metricId: `M${i + 1}`, weight, status: i === 0 ? "SCORED" : "UNKNOWN", rawScore: i === 0 ? 2 : null,
    reasonCodes: [i === 0 ? "TASK_SEMANTIC_ATOM_MATCH" : "ASSESSMENT_CONSUMER_BINDING_ABSENT"],
    evidenceRefs: i === 0 ? ["mock-only:goal", "mock-only:contract"] : [],
  })),
  dimensions: { A: { observedScore: { numerator: "100", denominator: "1" }, coverage: { numerator: "3", denominator: "11" }, applicableWeight: 22, scoredWeight: 6 } },
  taskOutcome: "INCONCLUSIVE", findings: [{ ruleId: "HG1", result: "BLOCKED", reasonCodes: ["ASSESSMENT_CONSUMER_BINDING_ABSENT"], evidenceRefs: [] }],
  limitations: ["PARTIAL_METRIC_COVERAGE", "SOURCE_CONTENT_BINDINGS_INCOMPLETE", "SOURCE_APPROVAL_IS_SEPARATE", "SCORE_DOES_NOT_ESTABLISH_TASK_SUCCESS", "UNKNOWN_REASON_FROM_SERVER"],
  formalQualification: { status: "NOT_GRANTED", reason: "CONSULT_FORMAL_AUTHORIZATION_AND_RUNTIME_QUALIFICATION" },
  comparisonKey: "mock-only:no-ranking", rankingPermitted: false,
};

export const mockObservedSummary: EvaluationSummary = {
  evaluationId: "mock-observed-move", caseId: "MOCK-UGV-MOVE", track: "core", risk: "medium", verdict: "NR",
  qualityScore: null, readiness: "not_ready", scoreStatus: "not_ready", fatalCount: 0, failedGates: [],
  completedAt: "2026-09-30T00:00:00Z", observedEvaluation: mockObservedEvaluation,
};
