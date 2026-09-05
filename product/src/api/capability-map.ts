import type { ApiCapabilityStatus, CapabilityMeta } from "../types";

export interface CapabilityDefinition {
  endpoint: string;
  operationId: string;
  status: ApiCapabilityStatus;
  sourceOfTruth: string;
  availabilityReason?: string;
}

const pg = "Benchmark PostgreSQL 权威记录";
const ch = "ClickHouse 证据/分析投影";
const artifact = "ArtifactStore 不可变制品";

export const apiCapabilityMap = {
  overview: { endpoint: "GET /v1/dashboard/overview", operationId: "getDashboardOverview", status: "existing", sourceOfTruth: `${pg} + ${ch}` },
  contextOptions: { endpoint: "GET /v1/context/options", operationId: "getContextOptions", status: "existing", sourceOfTruth: pg },
  systemTopology: { endpoint: "GET /v1/system/topology", operationId: "getSystemTopology", status: "new", sourceOfTruth: "Benchmark component registry + bounded probes" },
  systemComponents: { endpoint: "GET /v1/system/components", operationId: "listSystemComponents", status: "new", sourceOfTruth: "Benchmark component registry" },
  systemComponent: { endpoint: "GET /v1/system/components/{componentId}", operationId: "getSystemComponent", status: "new", sourceOfTruth: "Benchmark component registry" },
  systemComponentProbe: { endpoint: "POST /v1/system/components/{componentId}/probe", operationId: "probeSystemComponent", status: "new", sourceOfTruth: "Bounded read-only component probe" },
  systemCompatibility: { endpoint: "GET /v1/system/compatibility", operationId: "getSystemCompatibility", status: "new", sourceOfTruth: "Versioned component contracts" },
  environments: { endpoint: "GET /v1/environments", operationId: "listEnvironments", status: "new", sourceOfTruth: pg },
  environment: { endpoint: "GET /v1/environments/{environmentId}", operationId: "getEnvironment", status: "new", sourceOfTruth: `${pg} + read-only probe snapshot` },
  environmentProbe: { endpoint: "POST /v1/environments/{environmentId}/probe", operationId: "probeEnvironment", status: "new", sourceOfTruth: "Bounded read-only environment probe" },
  environmentResources: { endpoint: "GET /v1/environments/{environmentId}/resources", operationId: "listEnvironmentResources", status: "new", sourceOfTruth: `${pg} + live status` },
  environmentFaultProfiles: { endpoint: "GET /v1/environments/{environmentId}/fault-profiles", operationId: "listEnvironmentFaultProfiles", status: "new", sourceOfTruth: "Versioned native fault contracts" },
  environmentLeases: { endpoint: "GET /v1/environments/{environmentId}/leases", operationId: "listEnvironmentLeases", status: "new", sourceOfTruth: pg },
  nativeResources: { endpoint: "GET /v1/resources", operationId: "listResources", status: "new", sourceOfTruth: `${pg} + Provider/Simulator snapshots` },
  nativeResource: { endpoint: "GET /v1/resources/{resourceId}", operationId: "getResource", status: "new", sourceOfTruth: `${pg} + Provider/Simulator snapshots` },
  resourceCapabilities: { endpoint: "GET /v1/resources/{resourceId}/capabilities", operationId: "listResourceCapabilities", status: "new", sourceOfTruth: "SMPP/Provider contracts" },
  resourceObservations: { endpoint: "GET /v1/resources/{resourceId}/observations/latest", operationId: "getResourceLatestObservations", status: "new", sourceOfTruth: "Referee/Telemetry" },
  resourceMissions: { endpoint: "GET /v1/resources/{resourceId}/missions", operationId: "listResourceMissions", status: "new", sourceOfTruth: "ProviderOps current authority" },
  resourceBenchmarkHistory: { endpoint: "GET /v1/resources/{resourceId}/benchmark-history", operationId: "listResourceBenchmarkHistory", status: "new", sourceOfTruth: pg },
  caseResults: { endpoint: "GET /v1/case-results", operationId: "getCaseResults", status: "existing", sourceOfTruth: ch },
  caseDetail: { endpoint: "GET /v1/benchmark-cases/{caseId}", operationId: "getBenchmarkCasesByCaseId", status: "existing", sourceOfTruth: pg },
  runs: { endpoint: "GET /v1/benchmark-runs", operationId: "getBenchmarkRuns", status: "existing", sourceOfTruth: pg },
  runPreset: { endpoint: "GET /v1/benchmark-run-presets/ugv-diagnostic-development", operationId: "getUgvDiagnosticDevelopmentPreset", status: "new", sourceOfTruth: "Benchmark Server Development 配置" },
  runPresets: { endpoint: "GET /v1/benchmark-run-presets", operationId: "listBenchmarkRunPresets", status: "new", sourceOfTruth: pg },
  runPresetDetail: { endpoint: "GET /v1/benchmark-run-presets/{presetId}", operationId: "getBenchmarkRunPreset", status: "new", sourceOfTruth: pg },
  runPreflight: { endpoint: "POST /v1/benchmark-run-preflights", operationId: "preflightBenchmarkRun", status: "new", sourceOfTruth: `${pg} + Development capability resolver` },
  runCreate: { endpoint: "POST /v1/benchmark-runs", operationId: "createBenchmarkRun", status: "existing", sourceOfTruth: pg },
  runCancel: { endpoint: "POST /v1/benchmark-runs/{runId}/cancel", operationId: "cancelBenchmarkRun", status: "existing", sourceOfTruth: pg },
  runAuthority: { endpoint: "GET /v1/benchmark-runs/{runId}", operationId: "getBenchmarkRunAuthorityStatus", status: "existing", sourceOfTruth: pg },
  runRepetitions: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions", operationId: "listBenchmarkRunRepetitions", status: "existing", sourceOfTruth: pg },
  runEvents: { endpoint: "GET /v1/benchmark-runs/{runId}/events", operationId: "listBenchmarkRunEvents", status: "existing", sourceOfTruth: pg },
  runRerun: { endpoint: "POST /v1/benchmark-runs/{runId}/reruns", operationId: "createBenchmarkRunRerun", status: "new", sourceOfTruth: pg },
  runDiagnosticSummary: { endpoint: "GET /v1/benchmark-runs/{runId}/diagnostic-summary", operationId: "getBenchmarkRunDiagnosticSummary", status: "new", sourceOfTruth: `${pg} + ${ch} + ${artifact}` },
  runSubstitutions: { endpoint: "GET /v1/benchmark-runs/{runId}/substitutions", operationId: "getBenchmarkRunSubstitutions", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  runTimeline: { endpoint: "GET /v1/benchmark-runs/{runId}/timeline", operationId: "getBenchmarkRunTimeline", status: "new", sourceOfTruth: pg },
  runExecutionPlan: { endpoint: "GET /v1/benchmark-runs/{runId}/execution-plan", operationId: "getBenchmarkRunExecutionPlan", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  runNativeCoverage: { endpoint: "GET /v1/benchmark-runs/{runId}/native-coverage", operationId: "getBenchmarkRunNativeCoverage", status: "new", sourceOfTruth: "Composite native authorities" },
  runIdentityClosure: { endpoint: "GET /v1/benchmark-runs/{runId}/identity-closure", operationId: "getBenchmarkRunIdentityClosure", status: "new", sourceOfTruth: "Composite exact identity authorities" },
  runTelemetryStatus: { endpoint: "GET /v1/benchmark-runs/{runId}/telemetry-status", operationId: "getBenchmarkRunTelemetryStatus", status: "new", sourceOfTruth: `${pg} + Telemetry` },
  runEnvironment: { endpoint: "GET /v1/benchmark-runs/{runId}/environment", operationId: "getBenchmarkRunEnvironment", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  runResourceBindings: { endpoint: "GET /v1/benchmark-runs/{runId}/resource-bindings", operationId: "listBenchmarkRunResourceBindings", status: "new", sourceOfTruth: pg },
  runStream: { endpoint: "GET /v1/benchmark-runs/{runId}/stream", operationId: "streamBenchmarkRun", status: "new", sourceOfTruth: "SSE delivery over PostgreSQL snapshots" },
  runReconcile: { endpoint: "POST /v1/benchmark-runs/{runId}/reconcile", operationId: "reconcileBenchmarkRun", status: "new", sourceOfTruth: "PostgreSQL job authority; no new physical side effect" },
  repetitionTrajectory: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/trajectory", operationId: "getBenchmarkRunRepetitionTrajectory", status: "new", sourceOfTruth: "Referee/Telemetry + ArtifactStore" },
  repetitionIdentityClosure: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/identity-closure", operationId: "getBenchmarkRunRepetitionIdentityClosure", status: "new", sourceOfTruth: "Composite exact identity authorities" },
  repetitionTelemetry: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/telemetry", operationId: "getBenchmarkRunRepetitionTelemetry", status: "new", sourceOfTruth: "Telemetry + PostgreSQL" },
  repetitionProviderClosure: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/provider-closure", operationId: "getBenchmarkRunRepetitionProviderClosure", status: "new", sourceOfTruth: "Provider Closure v2 current authority" },
  repetitionPhysicalObservations: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/physical-observations", operationId: "listBenchmarkRunRepetitionPhysicalObservations", status: "new", sourceOfTruth: "Referee/Telemetry" },
  repetitionRawTraceLinks: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/raw-trace-links", operationId: "listBenchmarkRunRepetitionRawTraceLinks", status: "new", sourceOfTruth: "Telemetry scoped links" },
  repetitionEvaluation: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/evaluation", operationId: "getBenchmarkRunRepetitionEvaluation", status: "new", sourceOfTruth: pg },
  productArtifact: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts/{artifactId}", operationId: "getBenchmarkRunRepetitionArtifact", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  productArtifactContent: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts/{artifactId}/content", operationId: "getBenchmarkRunRepetitionArtifactContent", status: "new", sourceOfTruth: artifact },
  runDashboard: { endpoint: "GET /v1/benchmark-runs/{runId}/dashboard", operationId: "getBenchmarkRunsByRunIdDashboard", status: "existing", sourceOfTruth: `${pg} + ${ch}` },
  runCases: { endpoint: "GET /v1/benchmark-runs/{runId}/cases", operationId: "listBenchmarkRunCases", status: "existing", sourceOfTruth: ch },
  diagnosticQualification: { endpoint: "GET /v1/benchmark-runs/{runId}/qualification", operationId: "getDiagnosticRunQualification", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  diagnosticCapabilities: { endpoint: "GET /v1/benchmark-runs/{runId}/external-capabilities", operationId: "listDiagnosticExternalCapabilities", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  diagnosticRepetition: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}", operationId: "getDiagnosticRepetition", status: "new", sourceOfTruth: pg },
  diagnosticArtifacts: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/artifacts", operationId: "listDiagnosticRepetitionArtifacts", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  diagnosticExecutionTrace: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/execution-trace", operationId: "getDiagnosticExecutionTrace", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  diagnosticPhysicalVerification: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/physical-verification", operationId: "getDiagnosticPhysicalVerification", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  diagnosticFaultAttribution: { endpoint: "GET /v1/benchmark-runs/{runId}/repetitions/{repetitionId}/fault-attribution", operationId: "getDiagnosticFaultAttribution", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  reconciliationJobs: { endpoint: "GET /v1/reconciliation-jobs", operationId: "listReconciliationJobs", status: "new", sourceOfTruth: pg },
  reconciliationJob: { endpoint: "GET /v1/reconciliation-jobs/{jobId}", operationId: "getReconciliationJob", status: "new", sourceOfTruth: pg },
  reconciliationJobEvents: { endpoint: "GET /v1/reconciliation-jobs/{jobId}/events", operationId: "listReconciliationJobEvents", status: "new", sourceOfTruth: pg },
  reconciliationJobCancel: { endpoint: "POST /v1/reconciliation-jobs/{jobId}/cancel", operationId: "cancelReconciliationJob", status: "new", sourceOfTruth: pg },
  telemetrySources: { endpoint: "GET /v1/telemetry-sources", operationId: "listTelemetrySources", status: "new", sourceOfTruth: "Versioned Telemetry registry" },
  telemetrySource: { endpoint: "GET /v1/telemetry-sources/{sourceId}", operationId: "getTelemetrySource", status: "new", sourceOfTruth: "Versioned Telemetry registry" },
  telemetryWatermarks: { endpoint: "GET /v1/telemetry-sources/{sourceId}/watermarks", operationId: "getTelemetrySourceWatermarks", status: "new", sourceOfTruth: "Four-domain Telemetry authority" },
  telemetryDrift: { endpoint: "GET /v1/telemetry-sources/{sourceId}/drift", operationId: "getTelemetrySourceDrift", status: "new", sourceOfTruth: "Telemetry contract comparison" },
  attentionTimeline: { endpoint: "GET /v1/attention-items/{attentionId}/timeline", operationId: "getAttentionItemTimeline", status: "new", sourceOfTruth: pg },
  attentionEvidence: { endpoint: "GET /v1/attention-items/{attentionId}/evidence", operationId: "getAttentionItemEvidence", status: "new", sourceOfTruth: `${pg} + ${artifact}` },
  nativeCoverageAnalytics: { endpoint: "GET /v1/analytics/native-coverage", operationId: "listNativeCoverageAnalytics", status: "new", sourceOfTruth: ch },
  telemetryLagAnalytics: { endpoint: "GET /v1/analytics/telemetry-lag", operationId: "listTelemetryLagAnalytics", status: "new", sourceOfTruth: ch },
  reconciliationAnalytics: { endpoint: "GET /v1/analytics/reconciliation", operationId: "listReconciliationAnalytics", status: "new", sourceOfTruth: ch },
  identityClosureAnalytics: { endpoint: "GET /v1/analytics/identity-closure", operationId: "listIdentityClosureAnalytics", status: "new", sourceOfTruth: ch },
  environmentReliabilityAnalytics: { endpoint: "GET /v1/analytics/environment-reliability", operationId: "listEnvironmentReliabilityAnalytics", status: "new", sourceOfTruth: `${ch} + ${pg}` },
  physicalVerificationAnalytics: { endpoint: "GET /v1/analytics/physical-verification", operationId: "listPhysicalVerificationAnalytics", status: "new", sourceOfTruth: ch },
  comparison: { endpoint: "GET /v1/comparisons/{comparisonId}/dashboard", operationId: "getComparisonsByComparisonIdDashboard", status: "existing", sourceOfTruth: ch },
  comparisonCases: { endpoint: "GET /v1/comparisons/{comparisonId}/cases", operationId: "listComparisonCases", status: "existing", sourceOfTruth: ch },
  comparisonEvidenceDiffs: { endpoint: "GET /v1/comparisons/{comparisonId}/evidence-diffs", operationId: "getComparisonsByComparisonIdEvidenceDiffs", status: "existing", sourceOfTruth: `${ch} + ${artifact}` },
  evaluation: { endpoint: "GET /v1/evaluations/{evaluationId}", operationId: "getEvaluation", status: "existing", sourceOfTruth: `${pg} + ${ch}` },
  evaluations: { endpoint: "GET /v1/evaluations", operationId: "getEvaluations", status: "existing", sourceOfTruth: ch },
  evaluationReadiness: { endpoint: "GET /v1/evaluations/{evaluationId}/readiness", operationId: "getEvaluationsByEvaluationIdReadiness", status: "existing", sourceOfTruth: ch },
  evaluationMetrics: { endpoint: "GET /v1/evaluations/{evaluationId}/metrics", operationId: "getEvaluationsByEvaluationIdMetrics", status: "existing", sourceOfTruth: ch },
  evaluationProvenance: { endpoint: "GET /v1/evaluations/{evaluationId}/telemetry-provenance", operationId: "getEvaluationsByEvaluationIdTelemetryProvenance", status: "existing", sourceOfTruth: `${pg} + ${artifact}` },
  evaluationInput: { endpoint: "GET /v1/evaluation-input-snapshots/{snapshotId}", operationId: "getEvaluationInputSnapshotsBySnapshotId", status: "existing", sourceOfTruth: `${pg} + ${artifact}` },
  evidenceBundle: { endpoint: "GET /v1/evidence-bundles/{bundleId}", operationId: "getEvidenceBundlesByBundleId", status: "existing", sourceOfTruth: `${pg} + ${artifact}` },
  evidenceBundles: { endpoint: "GET /v1/evidence-bundles", operationId: "getEvidenceBundles", status: "existing", sourceOfTruth: pg },
  evidenceTimeline: { endpoint: "GET /v1/evidence-bundles/{bundleId}/timeline", operationId: "getEvidenceBundlesByBundleIdTimeline", status: "existing", sourceOfTruth: artifact },
  evidenceGraph: { endpoint: "GET /v1/evidence-bundles/{bundleId}/graph", operationId: "getEvidenceBundlesByBundleIdGraph", status: "existing", sourceOfTruth: artifact },
  evidenceDiff: { endpoint: "GET /v1/evidence-bundles/{bundleId}/diff", operationId: "getEvidenceBundlesByBundleIdDiff", status: "existing", sourceOfTruth: artifact },
  evidenceUsage: { endpoint: "GET /v1/evidence-bundles/{bundleId}/usage", operationId: "getEvidenceBundlesByBundleIdUsage", status: "existing", sourceOfTruth: pg },
  scoreDistribution: { endpoint: "GET /v1/analytics/score-distribution", operationId: "getAnalyticsScoreDistribution", status: "blocked_data", sourceOfTruth: ch, availabilityReason: "缺少正式统计量时保持 partial/null。" },
  operational: { endpoint: "GET /v1/analytics/operational", operationId: "getAnalyticsOperational", status: "blocked_data", sourceOfTruth: ch, availabilityReason: "缺少运行样本时保持 partial/null。" },
  analytics: { endpoint: "GET /v1/analytics/*", operationId: "analyticsModules", status: "existing", sourceOfTruth: ch },
  dataCompleteness: { endpoint: "GET /v1/data-completeness", operationId: "getDataCompleteness", status: "new", sourceOfTruth: `${pg} + ${ch} + ${artifact}` },
  diagnosticOutcomeDistribution: { endpoint: "GET /v1/analytics/diagnostic-outcome-distribution", operationId: "getDiagnosticOutcomeDistribution", status: "new", sourceOfTruth: ch },
  reports: { endpoint: "GET/POST /v1/reports", operationId: "getReports", status: "existing", sourceOfTruth: `${pg} + ${artifact}` },
  reportDownload: { endpoint: "GET /v1/reports/{reportId}/download", operationId: "getReportsByReportIdDownload", status: "existing", sourceOfTruth: artifact },
  alerts: { endpoint: "GET/PATCH /v1/attention-items", operationId: "getAttentionItems", status: "existing", sourceOfTruth: pg },
  systemWorkspace: { endpoint: "GET /ready + /v1/system/{status,contracts,projections}", operationId: "systemWorkspace", status: "existing", sourceOfTruth: "后端依赖探针、合同注册表与投影控制面" },
  candidateDetail: { endpoint: "GET /v1/candidates/{candidateSnapshotId}", operationId: "getCandidatesByCandidateSnapshotId", status: "existing", sourceOfTruth: pg },
  baselineDetail: { endpoint: "GET /v1/baselines/{baselineId}", operationId: "getBaselinesByBaselineId", status: "existing", sourceOfTruth: pg },
  datasetDetail: { endpoint: "GET /v1/datasets/{datasetVersionRef}", operationId: "getDatasetsByDatasetVersionRef", status: "existing", sourceOfTruth: pg },
  profileDetail: { endpoint: "GET /v1/evaluation-profiles/{profileVersionId}", operationId: "getEvaluationProfilesByProfileVersionId", status: "existing", sourceOfTruth: pg },
  telemetryTrace: { endpoint: "GET /telemetry-api/v1/evidence/trace", operationId: "externalTelemetryTrace", status: "external", sourceOfTruth: "Telemetry diagnostic live source — not immutable Benchmark authority" },
} satisfies Record<string, CapabilityDefinition>;

export type CapabilityKey = keyof typeof apiCapabilityMap;

export function capabilityMeta(
  key: CapabilityKey,
  options: {
    mocked: boolean;
    mode?: CapabilityMeta["mode"];
    operationId?: string;
    availability?: CapabilityMeta["availability"];
    reasonCodes?: string[];
    unavailableFields?: string[];
    warnings?: string[];
    watermark?: string | null;
    projectionLagMs?: number | null;
    contracts?: string[];
    generatedAt?: string;
  },
): CapabilityMeta {
  const definition = apiCapabilityMap[key];
  return {
    key,
    ...definition,
    mode: options.mode ?? (options.mocked ? "mock" : "http"),
    mocked: options.mocked,
    operationId: options.operationId ?? definition.operationId,
    availability: options.availability ?? "available",
    reasonCodes: options.reasonCodes ?? [],
    unavailableFields: options.unavailableFields ?? [],
    warnings: options.warnings ?? [],
    watermark: options.watermark ?? null,
    projectionLagMs: options.projectionLagMs ?? null,
    contracts: options.contracts ?? [],
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
}

export const capabilityStatusLabel: Record<ApiCapabilityStatus, string> = {
  existing: "LIVE",
  extend: "PARTIAL",
  new: "LIVE",
  blocked_data: "PARTIAL",
  external: "EXTERNAL",
};
