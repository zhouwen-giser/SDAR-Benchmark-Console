import assert from "node:assert/strict";

// Read-only verification of existing results. No Run, Move, scoring or mutation API.
const base = process.env.CONSOLE_API_BASE_URL ?? "http://127.0.0.1:4173/benchmark-api";
const evaluationId = process.env.EVALUATION_ID ?? "operational-evaluation-c9f51fafc9c3a4c6c1cd99ad8d7a9d3cf1c72367da9a845cc9830336df3ae52c";
const checks = [];
async function get(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path);
  checks.push({ method: "GET", path, status: response.status });
  return response.json();
}
const path = `/v1/evaluations/${encodeURIComponent(evaluationId)}`;
const detail = (await get(path)).data;
const expected = detail.caseDiagnosticEvaluation;
assert.equal(expected.schemaVersion, "sdar-benchmark.ugv-native-case-diagnostic-evaluation/2");
assert.equal(expected.policyRef.version, "2");
assert.equal(expected.policyRef.contentHash, "sha256:70c80c084cb3c11572da0bd97976f36e5bfab22f08c3b8e33a760763f8672bb5");
assert.deepEqual(expected.ruleScore, { numerator: "100", denominator: "1" });
assert.deepEqual(expected.coverage, { numerator: "1", denominator: "1" });
assert.equal(expected.caseVerdict, "PASS");
assert.equal(expected.scoredCount, 8);
assert.equal(expected.applicableCount, 8);
assert.equal(expected.notApplicableCount, 2);
assert.equal(expected.passCount, 8);
assert.equal(expected.failCount, 0);
assert.equal(expected.insufficientCount, 0);
assert.equal(expected.formalEligible, false);
assert.equal(expected.rankingPermitted, false);
assert.equal(expected.rules.length, 10);
assert.equal(expected.evidenceQuality.scope, "ARCHIVED_TASK_EXECUTION");
assert.equal(expected.evidenceQuality.observationCoverage, "BOUNDED_RECORDED_ONLY");
assert.equal(expected.evidenceQuality.sourceIndependence, "SAME_ORIGIN_MIRRORS_NOT_INDEPENDENT");
assert.equal(expected.evidenceQuality.accuracyBasis, "CONFIGURED_NOT_MEASURED");
assert.equal(expected.observedPhysicalEndState.taskAchievedAtTerminal, null);
assert.equal(detail.observedEvaluation.taskOutcome, "INCONCLUSIVE");
assert.equal(detail.observedEvaluation.formalQualification.status, "NOT_GRANTED");
assert.deepEqual(detail.observedEvaluation.observedScore, { numerator: "100", denominator: "1" });
assert.deepEqual(detail.observedEvaluation.coverage, { numerator: "3", denominator: "50" });
if (detail.passed != null) assert.equal(detail.passed, false);

const list = (await get("/v1/evaluations")).data;
const listed = list.find((row) => row.evaluationId === evaluationId);
assert.ok(listed, "Existing Evaluation is present in list");
assert.deepEqual(listed.observedEvaluation, detail.observedEvaluation);
for (const row of [listed, (await get(`${path}/readiness`)).data, (await get(`${path}/evidence-links`)).data]) {
  assert.deepEqual(row.caseDiagnosticEvaluation, expected);
  // Ancillary resources expose Case but do not require the full M result.
  if (row.observedEvaluation != null) assert.deepEqual(row.observedEvaluation, detail.observedEvaluation);
}
const health = await get("/health");
assert.equal(health.status, "ok");
process.stdout.write(JSON.stringify({ checkedAt: new Date().toISOString(), base, evaluationId, status: "PASS", checks,
  policy: expected.policyRef, sourceHash: expected.sourceHash, scoringInputHash: expected.scoringInputHash,
  case: { score: expected.ruleScore, coverage: expected.coverage, verdict: expected.caseVerdict, applicable: expected.applicableCount, scored: expected.scoredCount, pass: expected.passCount, fail: expected.failCount, unknown: expected.insufficientCount, notApplicable: expected.notApplicableCount },
  observed: { policy: detail.observedEvaluation.evaluationPolicyRef, score: detail.observedEvaluation.observedScore, coverage: detail.observedEvaluation.coverage, taskOutcome: detail.observedEvaluation.taskOutcome, formalQualification: detail.observedEvaluation.formalQualification.status },
  projectionStatus: detail.projectionStatus ?? null, strictPassed: detail.passed ?? null, health: { status: health.status, executionMode: health.executionMode },
  sideEffects: "GET only; no Run, Move, Candidate or scoring execution"
}, null, 2) + "\n");
