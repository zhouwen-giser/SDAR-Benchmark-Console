import type { CaseDiagnosticEvaluation } from "../types";

const statuses = ["SCORED", "PARTIAL_SCORED", "NO_DATA", "NOT_APPLICABLE", "INVALID_INPUT"];
const results = ["pass", "fail", "insufficient_evidence", "not_applicable"];
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const nullableText = (value: unknown) => value === null || typeof value === "string";
const fraction = (value: unknown) => value === null || (object(value) && typeof value.numerator === "string" && /^\d+$/.test(value.numerator) && typeof value.denominator === "string" && /^[1-9]\d*$/.test(value.denominator));
const ref = (value: unknown): value is { id: string; version: string; contentHash: string } => object(value) && ["id", "version", "contentHash"].every((key) => typeof value[key] === "string");
const sourceRef = (value: unknown) => object(value) && ["sourceRef", "originalSourcePointer", "originalHash"].every((key) => typeof value[key] === "string") && nullableText(value.clockBasis);
const sourceRefs = (value: unknown) => Array.isArray(value) && value.every(sourceRef);

/** Accept only the existing optional v1/v2 field; never infer scores or use a Mock fallback. */
export function caseDiagnosticEvaluationFrom(value: unknown): CaseDiagnosticEvaluation | undefined {
  if (value == null) return undefined;
  const fail = (): never => { throw new Error("Unsupported caseDiagnosticEvaluation response; no mock fallback"); };
  if (!object(value)) return fail();
  const version = value.schemaVersion === "sdar-benchmark.ugv-native-case-diagnostic-evaluation/1" ? "1"
    : value.schemaVersion === "sdar-benchmark.ugv-native-case-diagnostic-evaluation/2" ? "2" : undefined;
  if (!version || !ref(value.policyRef) || value.policyRef.version !== version || !ref(value.ruleSetRef) || !ref(value.caseRef)
    || !object(value.datasetRef) || typeof value.datasetRef.id !== "string" || typeof value.datasetRef.version !== "string"
    || !["caseId", "sourceHash", "scoringInputHash"].every((key) => typeof value[key] === "string")
    || !statuses.includes(String(value.resultStatus)) || !["PASS", "FAIL", "INCONCLUSIVE"].includes(String(value.caseVerdict))
    || !fraction(value.ruleScore) || !fraction(value.coverage) || !nullableText(value.displayScore)
    || !["applicableCount", "scoredCount", "passCount", "failCount", "insufficientCount", "notApplicableCount"].every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)
    || !strings(value.evidenceRefs) || !strings(value.limitations)
    || value.diagnosticOnly !== true || value.formalEligible !== false || value.rankingPermitted !== false
    || !Array.isArray(value.fields) || !value.fields.every((field) => object(field) && typeof field.ruleId === "string" && typeof field.targetPointer === "string" && ["DERIVED_VERIFIED", "ORIGINAL_GAP", "CONFLICT"].includes(String(field.status)) && sourceRefs(field.sourceRefs) && strings(field.reasonCodes))
    || !Array.isArray(value.rules) || !value.rules.every((rule) => object(rule) && typeof rule.ruleId === "string" && results.includes(String(rule.result)) && strings(rule.reasonCodes) && strings(rule.evidenceRefs) && strings(rule.missingEvidencePaths) && ["SUPPORTED", "INSUFFICIENT", "CONFLICT", "NOT_APPLICABLE"].includes(String(rule.provenanceStatus)))) return fail();
  if (version === "2") {
    const quality = value.evidenceQuality, physical = value.observedPhysicalEndState;
    const position = object(physical) ? physical.finalPosition : undefined;
    if (value.evaluationBasis !== "TASK_OBSERVABLE" || !value.rules.every((rule) => object(rule) && rule.evaluationBasis === "TASK_OBSERVABLE" && ["ARCHIVED_TASK_EXECUTION", "RECORDED_PROVIDER_TASK", "RECORDED_PHYSICAL_END_STATE"].includes(String(rule.scope)) && rule.observationCoverage === "BOUNDED_RECORDED_ONLY" && strings(rule.limitations) && nullableText(rule.clockBasis) && ["RECORDED_SOURCE", "DERIVED_SAME_ORIGIN", "LIMITED_OR_UNVERIFIED"].includes(String(rule.confidenceBasis)))
      || !object(quality) || quality.scope !== "ARCHIVED_TASK_EXECUTION" || quality.observationCoverage !== "BOUNDED_RECORDED_ONLY"
      || !["limitations", "timeBases", "missingProofs"].every((key) => strings(quality[key])) || !sourceRefs(quality.sourceRefs)
      || quality.accuracyBasis !== "CONFIGURED_NOT_MEASURED" || quality.sourceIndependence !== "SAME_ORIGIN_MIRRORS_NOT_INDEPENDENT"
      || !object(physical) || !results.slice(0, 3).includes(String(physical.result)) || !strings(physical.reasonCodes)
      || !Number.isSafeInteger(physical.sampleCount) || Number(physical.sampleCount) < 0 || physical.taskAchievedAtTerminal !== null
      || physical.accuracyBasis !== "CONFIGURED_NOT_MEASURED" || typeof physical.configuredPositionAccuracyM !== "number" || !Number.isFinite(physical.configuredPositionAccuracyM)
      || !["finalDistanceM", "finalSpeedMps", "dwellMs", "maximumTailGapMs", "targetToleranceM", "consecutiveSamples"].every((key) => physical[key] === null || (typeof physical[key] === "number" && Number.isFinite(physical[key]) && Number(physical[key]) >= 0))
      || !["calibrationHash", "firstSampleAt", "finalSampleAt"].every((key) => nullableText(physical[key]))
      || !(physical.timeBasis === null || physical.timeBasis === "REFEREE_RECEIVED_AT") || !(physical.clockDomain === null || physical.clockDomain === "referee_ingress_clock")
      || !["observedEndState", "movedInRecordedWindow"].every((key) => physical[key] === null || typeof physical[key] === "boolean")
      || !(position === null || (object(position) && ["longitude", "latitude", "altitudeM"].every((key) => typeof position[key] === "number" && Number.isFinite(position[key]))))) return fail();
  }
  return value as unknown as CaseDiagnosticEvaluation;
}
