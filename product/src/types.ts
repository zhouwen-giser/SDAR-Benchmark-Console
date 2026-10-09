export type Scenario = "blocked" | "ready" | "invalid";
export type UiDataState =
  | "loaded"
  | "loading"
  | "empty"
  | "error"
  | "stale"
  | "partial";

export type ApiCapabilityStatus =
  | "existing"
  | "extend"
  | "new"
  | "blocked_data"
  | "external";

export interface CapabilityMeta {
  key: string;
  endpoint: string;
  status: ApiCapabilityStatus;
  mode: "mock" | "msw" | "http" | "hybrid";
  mocked: boolean;
  operationId: string;
  availability: "available" | "partial" | "unavailable";
  reasonCodes: string[];
  unavailableFields: string[];
  warnings: string[];
  sourceOfTruth: string;
  watermark: string | null;
  projectionLagMs: number | null;
  contracts: string[];
  generatedAt: string;
  availabilityReason?: string;
}

export interface ApiResource<T> {
  data: T;
  meta: CapabilityMeta;
}

export type DataCompletenessStatus = "complete" | "partial" | "unavailable";

export interface DataCompletenessSectionView {
  sectionId: string;
  status: DataCompletenessStatus;
  expectedCount: number;
  availableCount: number;
  reasonCodes: string[];
  watermark?: string | null;
  details?: Record<string, unknown>;
}

export interface DataCompletenessView {
  schemaVersion: "sdar-benchmark.data-completeness/v1";
  generatedAt: string;
  overallStatus: DataCompletenessStatus;
  sections: DataCompletenessSectionView[];
}

export interface SnapshotMeta {
  snapshotId: string;
  watermark: string | null;
  projectionLagMs: number | null;
  dataStatus: "complete" | "partial" | "stale" | "empty";
  moduleErrors: Array<{ module: string; code?: string; reason: string }>;
}

export interface OverviewContext {
  candidate: { id: string; runtimeVersion: string; commit: string };
  baseline: { id: string; runtimeVersion: string; commit: string };
  dataset: { id: string; version: string };
  profile: { id: string; version: string };
  run: { id: string; status: string };
}

export interface OverviewKpis {
  qualityScore: number | null;
  qualityDelta: number | null;
  passRate: number | null;
  passDelta: number | null;
  provenFatal: number | null;
  requiredHgFailures: number | null;
  notReady: number | null;
  regressions: number | null;
  formalEvaluationRate: number | null;
  criticalRiskPassRate: number | null;
}

export interface AnalysisConclusion {
  id: string;
  severity: string;
  category: string;
  title: string;
  summary: string;
  affectedCases: number;
  generatedBy: string;
  formalizationStatus: string;
  drillDown: { page: string; filters: Record<string, string> };
}

export interface OverviewSnapshot {
  snapshot: SnapshotMeta;
  context: OverviewContext;
  releaseGate: { status: "blocked" | "ready" | "invalid" | "warning" | "unavailable"; blockingReasons: string[] };
  kpis: OverviewKpis;
  analysisConclusions: AnalysisConclusion[];
  attentionItems: Array<{
    priority: string;
    title: string;
    count?: number;
    value?: string;
    delta?: number;
    status: string;
  }>;
  qualityTrend: Array<{
    label: string;
    meanScore: number | null;
    passRate: number | null;
    criticalRiskPassRate: number | null;
    p10: number | null;
  }>;
  regressionWaterfall: null | {
    baseline: number;
    recovered: number;
    improved: number;
    regressed: number;
    newHg: number;
    notReady: number;
    candidate: number;
  };
  trackRiskMatrix: Array<{ track: string; risk: string; passRate: number | null }>;
  metricHeatmap: Array<{
    track: string;
    metric: string;
    score: number | null;
    formalCount: number;
    diagnosticCount: number;
    delta: number | null;
  }>;
  evidenceReadinessFunnel: {
    caseRepetitions: number | null;
    episodeResolved: number | null;
    manifestSealed: number | null;
    bundleComplete: number | null;
    evaluationReady: number | null;
    formalEvaluation: number | null;
    lossReasons: Record<string, number>;
  };
  sourceAwareEvidenceFunnel: Record<string, unknown>;
  qualityStabilityPoints: Array<{
    caseId: string;
    track: string;
    risk: string;
    averageScore: number;
    passStability: number;
    repetitions: number;
  }>;
  regressionContributors: Array<{ label: string; impactPercent: number }>;
  scoreDistribution: null | {
    p10: number;
    p25: number;
    median: number;
    p75: number;
    p90: number;
  };
  anomalyTimeline: Array<{
    at: string;
    severity: string;
    title: string;
    target: { type: string; id: string };
  }>;
  operationalSummary: Array<{
    metric: string;
    current: number | null;
    baseline: number | null;
    unit: string;
    changePercent: number | null;
  }>;
  systemStatus: Array<{ component: string; status: string; detail?: string }>;
  telemetryTrust: null | {
    status: string;
    reasonCodes: string[];
    watermark: string | null;
    canonical: Record<string, unknown>;
    domain: Record<string, unknown>;
    provider: Record<string, unknown>;
  };
  recentRuns: Array<{
    runId: string;
    candidate: string;
    caseCount: number;
    status: string;
    completedAt: string;
  }>;
}

export interface RunSummary {
  runId: string;
  candidate: string;
  dataset: string;
  profile: string;
  cases: number | null;
  completed: number | null;
  passRate: number | null;
  qualityScore: number | null;
  fatal: number | null;
  hg: number | null;
  nr: number | null;
  releaseGate: string;
  status: string;
  completedAt: string;
  parentRunId?: string | null;
  dataClass?: string;
  projectionStatus?: "available" | "partial" | "unavailable";
}

export interface CaseResult {
  caseId: string;
  title: string;
  track: string;
  risk: string;
  repetitions: number;
  verdict: string;
  score: number | null;
  stability: number | null;
  baselineDelta: number | null;
  failureType: string;
  change: string;
  gates: string[];
  missingEvidence: string[];
  evaluationId: string;
  bundleId?: string;
}

export interface RunDashboard {
  run: RunSummary;
  snapshot: SnapshotMeta;
  trackSummary: Array<{ label: string; value: number }>;
  riskSummary: Array<{ label: string; value: number }>;
  dimensions: Array<{ label: string; score: number }>;
  cases: CaseResult[];
  repetitions: unknown[];
  events: unknown[];
  evidenceFunnel: unknown | null;
  releaseGateDetail: unknown | null;
}

export interface ComparisonCase {
  caseId: string;
  track: string;
  risk: string;
  baselineVerdict: string;
  baselineScore: number | null;
  candidateVerdict: string;
  candidateScore: number | null;
  change: string;
  changed: string[];
  baselineBundleId?: string;
  candidateBundleId?: string;
  evaluationId: string;
}

export interface ComparisonDetail {
  comparisonId: string;
  baseline: Record<string, string | number | null>;
  candidate: Record<string, string | number | null>;
  summary: Record<string, number>;
  cases: ComparisonCase[];
}

/** Wire shape from Benchmark evidence-aware/1; never replaces strict scores. */
export interface EvaluationFraction { numerator: string; denominator: string }
export interface ObservedEvaluation {
  schemaVersion: "sdar-benchmark.observed-evaluation/1";
  evaluationPolicyRef: { id: string; version: string; contentHash: string };
  observedScore: EvaluationFraction | null;
  displayScore?: string | null;
  coverage: EvaluationFraction | null;
  scoreStatus: "SCORED" | "PARTIAL_SCORED" | "NO_DATA" | "NOT_APPLICABLE" | "INVALID_INPUT";
  applicableMetrics: string[];
  scoredMetrics: string[];
  applicableWeight: number;
  scoredWeight: number;
  metrics: Array<{
    metricId: string; weight: number;
    status: "SCORED" | "UNKNOWN" | "BLOCKED" | "NOT_APPLICABLE";
    rawScore: 0 | 1 | 2 | null;
    reasonCodes: string[]; evidenceRefs: string[];
  }>;
  dimensions?: Record<string, { observedScore: EvaluationFraction | null; coverage: EvaluationFraction | null; applicableWeight: number; scoredWeight: number }>;
  taskOutcome: "FAIL" | "INCONCLUSIVE";
  findings: Array<{ ruleId: string; result: string; reasonCodes: string[]; evidenceRefs: string[] }>;
  limitations: string[];
  formalQualification: { status: "NOT_GRANTED" | "GRANTED"; reason?: string };
  comparisonKey: string;
  rankingPermitted: false;
}

/** Additive, Server-owned ordinary Case result. v1 and v2 have different policies. */
export interface CaseDiagnosticSourceRef {
  sourceRef: string;
  originalSourcePointer: string;
  originalHash: string;
  clockBasis: string | null;
}

export interface CaseDiagnosticRule {
  ruleId: string;
  result: "pass" | "fail" | "insufficient_evidence" | "not_applicable";
  reasonCodes: string[];
  evidenceRefs: string[];
  missingEvidencePaths: string[];
  provenanceStatus: "SUPPORTED" | "INSUFFICIENT" | "CONFLICT" | "NOT_APPLICABLE";
}

interface CaseDiagnosticEvaluationBase {
  policyRef: { id: string; version: string; contentHash: string };
  ruleSetRef: { id: string; version: string; contentHash: string };
  caseId: string;
  caseRef: { id: string; version: string; contentHash: string };
  datasetRef: { id: string; version: string };
  sourceHash: string;
  scoringInputHash: string;
  resultStatus: ObservedEvaluation["scoreStatus"];
  caseVerdict: "PASS" | "FAIL" | "INCONCLUSIVE";
  ruleScore: EvaluationFraction | null;
  displayScore: string | null;
  coverage: EvaluationFraction | null;
  applicableCount: number;
  scoredCount: number;
  passCount: number;
  failCount: number;
  insufficientCount: number;
  notApplicableCount: number;
  fields: Array<{
    ruleId: string;
    targetPointer: string;
    status: "DERIVED_VERIFIED" | "ORIGINAL_GAP" | "CONFLICT";
    sourceRefs: CaseDiagnosticSourceRef[];
    reasonCodes: string[];
  }>;
  evidenceRefs: string[];
  limitations: string[];
  diagnosticOnly: true;
  formalEligible: false;
  rankingPermitted: false;
}

export interface CaseDiagnosticEvaluationV1 extends CaseDiagnosticEvaluationBase {
  schemaVersion: "sdar-benchmark.ugv-native-case-diagnostic-evaluation/1";
  rules: CaseDiagnosticRule[];
}

export interface ObservableCaseDiagnosticRule extends CaseDiagnosticRule {
  evaluationBasis: "TASK_OBSERVABLE";
  scope: "ARCHIVED_TASK_EXECUTION" | "RECORDED_PROVIDER_TASK" | "RECORDED_PHYSICAL_END_STATE";
  observationCoverage: "BOUNDED_RECORDED_ONLY";
  limitations: string[];
  clockBasis: string | null;
  confidenceBasis: "RECORDED_SOURCE" | "DERIVED_SAME_ORIGIN" | "LIMITED_OR_UNVERIFIED";
}

export interface CaseDiagnosticEvaluationV2 extends CaseDiagnosticEvaluationBase {
  schemaVersion: "sdar-benchmark.ugv-native-case-diagnostic-evaluation/2";
  evaluationBasis: "TASK_OBSERVABLE";
  rules: ObservableCaseDiagnosticRule[];
  evidenceQuality: {
    scope: "ARCHIVED_TASK_EXECUTION";
    observationCoverage: "BOUNDED_RECORDED_ONLY";
    limitations: string[];
    timeBases: string[];
    missingProofs: string[];
    accuracyBasis: "CONFIGURED_NOT_MEASURED";
    sourceIndependence: "SAME_ORIGIN_MIRRORS_NOT_INDEPENDENT";
    sourceRefs: CaseDiagnosticSourceRef[];
  };
  observedPhysicalEndState: {
    result: "pass" | "fail" | "insufficient_evidence";
    reasonCodes: string[];
    sampleCount: number;
    finalPosition: { longitude: number; latitude: number; altitudeM: number } | null;
    timeBasis: "REFEREE_RECEIVED_AT" | null;
    clockDomain: "referee_ingress_clock" | null;
    accuracyBasis: "CONFIGURED_NOT_MEASURED";
    configuredPositionAccuracyM: number;
    calibrationHash: string | null;
    observedEndState: boolean | null;
    taskAchievedAtTerminal: null;
    movedInRecordedWindow: boolean | null;
    finalDistanceM: number | null;
    finalSpeedMps: number | null;
    dwellMs: number | null;
    maximumTailGapMs: number | null;
    targetToleranceM: number | null;
    consecutiveSamples: number | null;
    firstSampleAt: string | null;
    finalSampleAt: string | null;
  };
}

export type CaseDiagnosticEvaluation = CaseDiagnosticEvaluationV1 | CaseDiagnosticEvaluationV2;

export interface EvaluationDetail {
  observedEvaluation?: ObservedEvaluation;
  caseDiagnosticEvaluation?: CaseDiagnosticEvaluation;
  evaluationId: string;
  caseId: string;
  episodeId: string;
  origin: string;
  profile: string;
  bundleId: string;
  readiness: { source: string; evaluation: string; missing: string[]; conflicts: string[] };
  scoreStatus: string;
  qualityScore: number | null;
  level: string;
  passed: boolean;
  fatals: Array<{ id: string; matched: boolean; proofStatus: string; evidenceLevel: string }>;
  gates: Array<{
    id: string;
    result: string;
    reason?: string;
    evidenceRefs?: string[];
  }>;
  metrics: Array<{
    id: string;
    raw: number | null;
    weight: number;
    evidenceLevel: string;
    status: string;
    summary: string;
  }>;
  dimensions: Array<{ id: string; label: string; score: number }>;
  findings: Array<{
    severity: string;
    title: string;
    summary: string;
    evidenceRefs: string[];
    recommendedAction: string;
  }>;
}

export interface ContextOption {
  id: string;
  label: string;
  secondary?: string;
}

export interface ContextOptionsView {
  candidates: ContextOption[];
  baselines: ContextOption[];
  datasets: ContextOption[];
  profiles: ContextOption[];
  runs: ContextOption[];
  defaults: {
    candidateSnapshotId: string | null;
    baselineId: string | null;
    datasetVersionRef: string | null;
    profileVersionId: string | null;
  };
  compatibilityPolicy: string;
}

export interface EvaluationHeaderView {
  observedEvaluation?: ObservedEvaluation;
  caseDiagnosticEvaluation?: CaseDiagnosticEvaluation;
  projectionStatus?: string;
  evaluationId: string;
  caseId: string;
  episodeId: string | null;
  origin: string;
  profileVersionId: string;
  bundleSnapshotId: string;
  readiness: string;
  scoreStatus: string;
  qualityScore: number | null;
  level: string;
  passed: boolean | null;
  createdAt: string | null;
}

export interface EvaluationReadinessView {
  sourceEvidenceReadiness: string | null;
  evaluationReadiness: string;
  missingFamilies: string[];
  conflictingFamilies: string[];
  reasonCodes: string[];
}

export interface EvaluationEvidenceGradeView {
  family: string;
  grade: string | null;
  reasonCodes: string[];
  evidenceRefs: string[];
}

export interface EvaluationFatalView {
  id: string;
  matched: boolean | null;
  proofStatus: string;
  evidenceLevel: string | null;
  evidenceRefs: string[];
  reasonCodes: string[];
}

export interface EvaluationHardGateView {
  id: string;
  result: string;
  reason: string | null;
  evidenceRefs: string[];
  reasonCodes: string[];
}

export interface EvaluationMetricView {
  id: string;
  raw: number | null;
  weight: number | null;
  evidenceLevel: string | null;
  status: string;
  summary: string | null;
  reasonCodes: string[];
}

export interface EvaluationDimensionView {
  id: string;
  label: string;
  score: number | null;
  threshold: number | null;
  passed: boolean | null;
  applicable: boolean;
  metricIds: string[];
}

export interface EvaluationFindingView {
  id: string;
  type: string;
  severity: string | null;
  summary: string;
  evidenceRefs: string[];
  priority: string | null;
}

export interface EvaluationEvidenceLinksView {
  evaluationId: string;
  bundleSnapshotId: string;
  bundleArtifactRef: string;
  bundleContentHash: string | null;
  inputSnapshotId: string | null;
  inputSnapshotContentHash: string | null;
  inputSnapshotArtifactUri: string | null;
  formalInputEligible: boolean | null;
  compositeReadiness: string | null;
  inputSourceWatermark: string | null;
  inputSourceRefs: EvaluationInputSourceRefView[];
  evidenceRefs: string[];
}

export interface EvaluationInputSourceRefView {
  sourceType: "canonical" | "domain" | "provider" | string;
  readiness: string;
  required: boolean | null;
  watermark: string | null;
  reasonCodes: string[];
  artifactUri: string | null;
  artifactHash: string | null;
  contentHash: string | null;
  schemaVersion: string | null;
}

export interface TelemetryProvenanceView {
  evaluationId: string;
  origin: string;
  inputSnapshotId: string;
  inputSnapshotContentHash: string;
  overallReadiness: string;
  formalInputEligible: boolean;
  effectiveWatermark: string;
  sources: EvaluationInputSourceRefView[];
}

export interface EvaluationInputSnapshotView {
  snapshotId: string;
  contentHash: string;
  episodeId: string;
  profileVersionId: string;
  overallReadiness: string;
  overallReasonCodes: string[];
  formalInputEligible: boolean;
  effectiveWatermark: string;
  artifactUri: string;
  artifactHash: string;
  recordedAt: string;
  sources: EvaluationInputSourceRefView[];
}

export interface EvaluationInputMaterialView {
  snapshotId: string;
  source: EvaluationInputSourceRefView;
  immutable: true;
  material: unknown;
  rawTracePath: string | null;
  authority: string;
}

export interface EvidenceRecordView {
  recordId: string;
  recordFamily: string;
  recordType: string;
  sourceSystem: string;
  evidenceSequence: string;
  occurredAt: string;
  evidenceRefs: string[];
  artifactRefs: string[];
  payloadHash: string;
  payload: Record<string, unknown>;
}

export interface EvidenceGraphView {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  inferredEdges: Array<Record<string, unknown>>;
  warnings: string[];
}

export interface EvidenceDiffView {
  mode: string;
  leftBundleId: string;
  rightBundleId: string;
  pairs: Array<Record<string, unknown>>;
  added: Array<string | null>;
  removed: Array<string | null>;
  changed: Array<Record<string, unknown>>;
  relationChanges: Array<Record<string, unknown>>;
  sequenceChanges: Array<Record<string, unknown>>;
  missingExpectedLinks: string[];
  warnings: string[];
}

export interface AnalyticsModuleView {
  key: string;
  title: string;
  rows: unknown[];
}

export interface ReportContentView {
  reportId: string;
  mediaType: string;
  content: unknown;
  contentHash: string | null;
}

export interface ReportDownloadView {
  reportId: string;
  filename: string;
  mediaType: string;
  contentHash: string;
  sizeBytes: number;
  encoding: "base64";
  content: string;
}

export interface EvidenceTimelineItem {
  id: string;
  type: string;
  label: string;
  time: string;
  status: string;
}

export interface EvidenceDetail {
  bundleId: string;
  episodeId: string;
  manifestRevision: number;
  status: string;
  recordCount: number;
  sequenceRange: number[];
  bundleHash: string;
  requiredFamilies: string[];
  missingFamilies: string[];
  timeline: EvidenceTimelineItem[];
  diff: {
    baselineBundleId: string;
    added: Array<Record<string, string>>;
    removed: Array<Record<string, string>>;
    changed: Array<Record<string, string>>;
    relationChanges: Array<Record<string, string>>;
  };
}

export interface AnalysisFilters {
  candidateId: string;
  baselineId: string;
  datasetVersion: string;
  profileVersionId: string;
  runId: string;
  track: string;
  risk: string;
  period: string;
  scenario: Scenario;
  dataState: UiDataState;
}

export interface EvaluationSummary {
  observedEvaluation?: ObservedEvaluation;
  caseDiagnosticEvaluation?: CaseDiagnosticEvaluation;
  evaluationId: string;
  caseId: string;
  track: string;
  risk: string;
  verdict: string;
  qualityScore: number | null;
  readiness: "ready" | "not_ready";
  scoreStatus: "formal" | "diagnostic" | "not_ready";
  fatalCount: number;
  failedGates: string[];
  bundleId?: string;
  completedAt: string;
}

export interface EvidenceBundleSummary {
  bundleId: string;
  caseId: string;
  episodeId: string;
  status: "complete" | "partial" | "pending";
  manifestRevision: number;
  recordCount: number;
  missingFamilies: string[];
  evaluationId?: string;
  bundleHash: string;
  createdAt: string;
}

export interface CaseExecution {
  repetition: number;
  episodeId: string;
  status: "completed" | "failed" | "pending";
  verdict: string;
  score: number | null;
  durationMs: number | null;
  evaluationId?: string;
  bundleId?: string;
}

export interface CaseDetail {
  caseId: string;
  title: string;
  description: string;
  track: string;
  risk: string;
  status: "active" | "draft" | "retired";
  owner: string;
  sourceRevision: number;
  tags: string[];
  preconditions: string[];
  actions: string[];
  expectedOutcomes: string[];
  requiredEvidenceFamilies: string[];
  requiredGates: string[];
  executions: CaseExecution[];
  history: Array<{ revision: number; at: string; author: string; summary: string }>;
}

export interface ReportRecord {
  reportId: string;
  title: string;
  type: "release_review" | "regression_digest" | "evidence_audit" | "snapshot" | "run" | "comparison" | "evaluation";
  status: "ready" | "draft" | "queued" | "rendering" | "completed" | "failed";
  scope: string;
  format: "JSON" | "Markdown" | "HTML";
  sections: string[];
  createdAt: string;
  createdBy: string;
}

export interface AlertRecord {
  alertId: string;
  severity: "critical" | "high" | "medium";
  status: "open" | "acknowledged" | "resolved" | "ignored";
  title: string;
  source: string;
  targetType: "case" | "run" | "evaluation" | "projection";
  targetId: string;
  reason: string;
  createdAt: string;
  owner?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface SystemWorkspace {
  services: Array<{ name: string; role: string; status: "healthy" | "degraded" | "external"; detail: string }>;
  contracts: Array<{ name: string; version: string; source: string; status: "active" | "draft" }>;
  projections: Array<{ name: string; watermark: string; lagMs: number; status: "healthy" | "stale" }>;
  adapters: Array<{ mode: "mock" | "http" | "hybrid" | "msw"; description: string; recommendedFor: string }>;
}

export type ResourceKind = "candidate" | "baseline" | "dataset" | "profile";

export interface ResourceDetail {
  kind: ResourceKind;
  id: string;
  title: string;
  status: string;
  description: string;
  properties: Array<{ label: string; value: string }>;
  relations: Array<{ label: string; id: string; path: string }>;
  history: Array<{ at: string; event: string; actor: string }>;
}
