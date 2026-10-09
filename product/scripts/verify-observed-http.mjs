import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

// Read-only: existing Evaluation APIs, through the same proxy used by the UI.
const base = process.env.OBSERVED_API_BASE ?? "http://127.0.0.1:4173/benchmark-api";
const evaluationId = process.env.OBSERVED_EVALUATION_ID ?? "operational-evaluation-76b6689b5bcd8d5982e4ab9a24eba9a7708124f5ea698679940ab4db320f21dd";
const paths = ["/v1/evaluations", `/v1/evaluations/${evaluationId}`, `/v1/evaluations/${evaluationId}/readiness`, `/v1/evaluations/${evaluationId}/evidence-links`];
const responses = await Promise.all(paths.map(async (path) => {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  assert.equal(response.status, 200, `${path}: ${text.slice(0, 400)}`);
  return { path, status: response.status, sha256: createHash("sha256").update(text).digest("hex"), body: JSON.parse(text) };
}));
const row = responses[0].body.data.find((entry) => entry.evaluationId === evaluationId);
assert.ok(row, "Existing real Move evaluation must appear in the list");
const observed = row.observedEvaluation;
assert.equal(observed.schemaVersion, "sdar-benchmark.observed-evaluation/1");
assert.equal(observed.evaluationPolicyRef.id, "evidence-aware");
assert.equal(observed.evaluationPolicyRef.version, "1");
assert.equal(observed.displayScore, "100.000000");
assert.deepEqual(observed.observedScore, { numerator: "100", denominator: "1" });
assert.deepEqual(observed.coverage, { numerator: "3", denominator: "50" });
assert.equal(observed.scoreStatus, "PARTIAL_SCORED");
assert.equal(observed.applicableWeight, 100);
assert.equal(observed.scoredWeight, 6);
assert.equal(observed.applicableMetrics.length, 15);
assert.deepEqual(observed.scoredMetrics, ["M1"]);
assert.equal(observed.metrics.length, 15);
assert.equal(observed.metrics[0].status, "SCORED");
assert.equal(observed.metrics[0].rawScore, 2);
assert.ok(observed.metrics.slice(1).every((entry) => entry.status === "UNKNOWN" && entry.rawScore === null));
assert.equal(observed.taskOutcome, "INCONCLUSIVE");
assert.equal(observed.formalQualification.status, "NOT_GRANTED");
assert.equal(observed.rankingPermitted, false);
assert.ok(observed.limitations.includes("PARTIAL_METRIC_COVERAGE"));
assert.ok(observed.limitations.includes("SCORE_DOES_NOT_ESTABLISH_TASK_SUCCESS"));
assert.equal(row.qualityScore, null, "Ordinary score must not replace strict qualityScore");
assert.deepEqual(responses[1].body.data.observedEvaluation, observed);
assert.deepEqual(responses[2].body.data.observedEvaluation, observed);
const ready = await fetch(`${base}/ready`, { signal: AbortSignal.timeout(15000) });
const readiness = { status: ready.status, body: await ready.json() };
const report = {
  checkedAt: new Date().toISOString(), base, evaluationId, method: "GET only",
  result: "PASS", score: "100.0", coverage: "6%", weights: "6/100", metrics: "1/15",
  scoreStatus: observed.scoreStatus, taskOutcome: observed.taskOutcome, formalQualification: observed.formalQualification,
  strictQualityScore: row.qualityScore, projectionStatus: responses[1].body.data.projectionStatus,
  sourceBoundary: "Archived real Move, existing local Benchmark API/PG; retrospective diagnostic registration, not a new run or formal qualification",
  readiness, responses,
};
const output = new URL("../reports/observed-evaluation/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL("http-verification.json", output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ result: report.result, evaluationId, score: report.score, coverage: report.coverage, projectionStatus: report.projectionStatus, readinessStatus: readiness.status, endpoints: responses.map(({ path, status }) => ({ path, status })) }, null, 2));
