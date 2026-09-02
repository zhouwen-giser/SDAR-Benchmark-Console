import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const spec = await readFile(new URL("api/benchmark-server.openapi.yaml", root), "utf8");
const lock = JSON.parse(await readFile(new URL("api/benchmark-server.openapi.source-lock.json", root), "utf8"));
const sha256 = createHash("sha256").update(spec).digest("hex");
const pathsSection = spec.slice(spec.indexOf("\npaths:\n"), spec.indexOf("\ncomponents:\n"));
const operationCount = [...pathsSection.matchAll(/^\s+operationId:\s+\S+/gmu)].length;

if (sha256 !== lock.openapiSha256) throw new Error(`OpenAPI SHA-256 drift: ${sha256}`);
if (operationCount !== lock.operationCount || operationCount !== 114) throw new Error(`Expected 114 operations, found ${operationCount}`);

const requiredPaths = [
  "/health", "/ready", "/v1/context/options", "/v1/dashboard/overview", "/v1/benchmark-runs",
  "/v1/benchmark-run-preflights", "/v1/benchmark-run-presets/ugv-diagnostic-development",
  "/v1/benchmark-runs/{runId}/qualification", "/v1/benchmark-runs/{runId}/external-capabilities",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/execution-trace",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/physical-verification",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/fault-attribution",
  "/v1/case-results", "/v1/benchmark-cases/{caseId}", "/v1/comparisons/{comparisonId}/dashboard",
  "/v1/evaluations", "/v1/evaluations/{evaluationId}/telemetry-provenance",
  "/v1/evaluation-input-snapshots/{snapshotId}", "/v1/evidence-bundles/{bundleId}/usage",
  "/v1/analytics/quality-trend", "/v1/reports/{reportId}/download", "/v1/attention-items/{attentionId}",
  "/v1/system/status", "/v1/system/contracts", "/v1/system/projections",
];
for (const path of requiredPaths) if (!spec.includes(`  ${path}:`)) throw new Error(`Required formal path missing: ${path}`);

const sourceRoot = new URL("src/", root);
const sourceFiles = await walk(sourceRoot.pathname);
const banned = [/\/v1\/cases(?:\/|["'`])/u, /\/v1\/profiles(?:\/|["'`])/u, /\/v1\/analytics\/workspace/u, /\/v1\/alerts(?:\/|["'`])/u, /\/v1\/system\/workspace/u];
for (const file of sourceFiles.filter((path) => /\.(?:ts|tsx)$/u.test(path))) {
  const source = await readFile(file, "utf8");
  for (const expression of banned) if (expression.test(source)) throw new Error(`Banned prototype path ${expression} remains in ${file}`);
}

console.log(`Verified formal Benchmark API: ${operationCount} operations, sha256 ${sha256}.`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}
