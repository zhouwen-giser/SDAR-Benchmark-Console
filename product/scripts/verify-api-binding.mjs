import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const spec = await readFile(new URL("api/benchmark-server.openapi.yaml", root), "utf8");
const lock = JSON.parse(await readFile(new URL("api/benchmark-server.openapi.source-lock.json", root), "utf8"));
const sha256 = createHash("sha256").update(spec).digest("hex");
const pathsSection = spec.slice(spec.indexOf("\npaths:\n"), spec.indexOf("\ncomponents:\n"));
const operationCount = [...pathsSection.matchAll(/^\s+operationId:\s+\S+/gmu)].length;
const operationIds = [...pathsSection.matchAll(/^\s+operationId:\s+(\S+)/gmu)].map((match) => match[1]);

if (sha256 !== lock.openapiSha256) throw new Error(`OpenAPI SHA-256 drift: ${sha256}`);
if (operationCount !== lock.operationCount || operationCount !== 172) throw new Error(`Expected 172 operations, found ${operationCount}`);
if (new Set(operationIds).size !== 172) throw new Error(`Expected 172 unique operationIds, found ${new Set(operationIds).size}`);

const requiredPaths = [
  "/health", "/ready", "/v1/context/options", "/v1/dashboard/overview", "/v1/benchmark-runs",
  "/v1/benchmark-run-presets", "/v1/benchmark-run-presets/{presetId}",
  "/v1/benchmark-run-preflights", "/v1/benchmark-run-presets/ugv-diagnostic-development",
  "/v1/benchmark-runs/{runId}/reruns", "/v1/benchmark-runs/{runId}/diagnostic-summary",
  "/v1/benchmark-runs/{runId}/substitutions", "/v1/benchmark-runs/{runId}/timeline",
  "/v1/benchmark-runs/{runId}/qualification", "/v1/benchmark-runs/{runId}/external-capabilities",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/evaluation",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts/{artifactId}",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts/{artifactId}/content",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/execution-trace",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/physical-verification",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/fault-attribution",
  "/v1/case-results", "/v1/benchmark-cases/{caseId}", "/v1/comparisons/{comparisonId}/dashboard",
  "/v1/evaluations", "/v1/evaluations/{evaluationId}/telemetry-provenance",
  "/v1/evaluation-input-snapshots/{snapshotId}", "/v1/evidence-bundles/{bundleId}/usage",
  "/v1/analytics/quality-trend", "/v1/analytics/diagnostic-outcome-distribution", "/v1/data-completeness",
  "/v1/reports/{reportId}/download", "/v1/attention-items/{attentionId}",
  "/v1/system/status", "/v1/system/contracts", "/v1/system/projections",
  "/v1/system/topology", "/v1/system/components", "/v1/system/components/{componentId}",
  "/v1/system/components/{componentId}/probe", "/v1/system/compatibility",
  "/v1/environments", "/v1/environments/{environmentId}", "/v1/environments/{environmentId}/probe",
  "/v1/environments/{environmentId}/resources", "/v1/environments/{environmentId}/fault-profiles", "/v1/environments/{environmentId}/leases",
  "/v1/resources", "/v1/resources/{resourceId}", "/v1/resources/{resourceId}/capabilities",
  "/v1/resources/{resourceId}/observations/latest", "/v1/resources/{resourceId}/missions", "/v1/resources/{resourceId}/benchmark-history",
  "/v1/benchmark-runs/{runId}/execution-plan", "/v1/benchmark-runs/{runId}/native-coverage",
  "/v1/benchmark-runs/{runId}/identity-closure", "/v1/benchmark-runs/{runId}/telemetry-status",
  "/v1/benchmark-runs/{runId}/environment", "/v1/benchmark-runs/{runId}/resource-bindings",
  "/v1/benchmark-runs/{runId}/stream", "/v1/benchmark-runs/{runId}/reconcile",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/trajectory",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/identity-closure",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/telemetry",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/provider-closure",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/physical-observations",
  "/v1/benchmark-runs/{runId}/repetitions/{repetitionId}/raw-trace-links",
  "/v1/reconciliation-jobs", "/v1/reconciliation-jobs/{jobId}", "/v1/reconciliation-jobs/{jobId}/events", "/v1/reconciliation-jobs/{jobId}/cancel",
  "/v1/telemetry-sources", "/v1/telemetry-sources/{sourceId}", "/v1/telemetry-sources/{sourceId}/watermarks", "/v1/telemetry-sources/{sourceId}/drift",
  "/v1/attention-items/{attentionId}/timeline", "/v1/attention-items/{attentionId}/evidence",
  "/v1/analytics/native-coverage", "/v1/analytics/telemetry-lag", "/v1/analytics/reconciliation",
  "/v1/analytics/identity-closure", "/v1/analytics/environment-reliability", "/v1/analytics/physical-verification",
];
for (const path of requiredPaths) if (!spec.includes(`  ${path}:`)) throw new Error(`Required formal path missing: ${path}`);

const requiredOperationIds = [
  "listBenchmarkRunPresets", "getBenchmarkRunPreset", "createBenchmarkRunRerun",
  "getBenchmarkRunDiagnosticSummary", "getBenchmarkRunSubstitutions", "getBenchmarkRunTimeline",
  "getBenchmarkRunRepetitionEvaluation", "getBenchmarkRunRepetitionArtifact",
  "getBenchmarkRunRepetitionArtifactContent", "getDataCompleteness", "getDiagnosticOutcomeDistribution",
  "getSystemTopology", "listSystemComponents", "getSystemComponent", "probeSystemComponent", "getSystemCompatibility",
  "listEnvironments", "getEnvironment", "probeEnvironment", "listEnvironmentResources", "listEnvironmentFaultProfiles", "listEnvironmentLeases",
  "listResources", "getResource", "listResourceCapabilities", "getResourceLatestObservations", "listResourceMissions", "listResourceBenchmarkHistory",
  "getBenchmarkRunExecutionPlan", "getBenchmarkRunNativeCoverage", "getBenchmarkRunIdentityClosure", "getBenchmarkRunTelemetryStatus",
  "getBenchmarkRunEnvironment", "listBenchmarkRunResourceBindings", "streamBenchmarkRun", "reconcileBenchmarkRun",
  "getBenchmarkRunRepetitionTrajectory", "getBenchmarkRunRepetitionIdentityClosure", "getBenchmarkRunRepetitionTelemetry",
  "getBenchmarkRunRepetitionProviderClosure", "listBenchmarkRunRepetitionPhysicalObservations", "listBenchmarkRunRepetitionRawTraceLinks",
  "listReconciliationJobs", "getReconciliationJob", "listReconciliationJobEvents", "cancelReconciliationJob",
  "listTelemetrySources", "getTelemetrySource", "getTelemetrySourceWatermarks", "getTelemetrySourceDrift",
  "getAttentionItemTimeline", "getAttentionItemEvidence", "listNativeCoverageAnalytics", "listTelemetryLagAnalytics",
  "listReconciliationAnalytics", "listIdentityClosureAnalytics", "listEnvironmentReliabilityAnalytics", "listPhysicalVerificationAnalytics",
];
for (const operationId of requiredOperationIds) if (!operationIds.includes(operationId)) throw new Error(`Required operationId missing: ${operationId}`);

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
