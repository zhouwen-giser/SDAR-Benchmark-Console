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
