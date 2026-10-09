import type { ObservedEvaluation } from "../types";

/** Additive wire field; null/absent old records stay on the legacy path. */
export function observedEvaluationFrom(value: unknown): ObservedEvaluation | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid observedEvaluation response");
  const row = value as Record<string, unknown>;
  if (row.schemaVersion !== "sdar-benchmark.observed-evaluation/1"
    || !["SCORED", "PARTIAL_SCORED", "NO_DATA", "NOT_APPLICABLE", "INVALID_INPUT"].includes(String(row.scoreStatus))
    || !["metrics", "applicableMetrics", "scoredMetrics", "findings", "limitations"].every((key) => Array.isArray(row[key]))
    || typeof row.evaluationPolicyRef !== "object" || row.evaluationPolicyRef === null
    || typeof row.formalQualification !== "object" || row.formalQualification === null) {
    throw new Error("Unsupported observedEvaluation response; no mock fallback");
  }
  return value as ObservedEvaluation;
}
