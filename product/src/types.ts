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
  mocked: boolean;
  sourceOfTruth: string;
  watermark: string | null;
  projectionLagMs: number | null;
  availabilityReason?: string;
}

export interface ApiResource<T> {
  data: T;
  meta: CapabilityMeta;
}

export interface SnapshotMeta {
  snapshotId: string;
  watermark: string;
  projectionLagMs: number;
  dataStatus: "complete" | "partial" | "stale" | "empty";
  moduleErrors: Array<{ module: string; reason: string }>;
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
  releaseGate: { status: "blocked" | "ready" | "invalid" | "warning"; blockingReasons: string[] };
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
    score: number;
    formalCount: number;
    diagnosticCount: number;
    delta: number;
  }>;
  evidenceReadinessFunnel: {
    caseRepetitions: number;
    episodeResolved: number;
    manifestSealed: number;
    bundleComplete: number;
    evaluationReady: number;
    formalEvaluation: number;
    lossReasons: Record<string, number>;
  };
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
  cases: number;
  completed: number;
  passRate: number | null;
  qualityScore: number | null;
  fatal: number | null;
  hg: number | null;
  nr: number | null;
  releaseGate: string;
  status: string;
  completedAt: string;
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

export interface EvaluationDetail {
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
  type: "release_review" | "regression_digest" | "evidence_audit";
  status: "ready" | "draft";
  scope: string;
  format: "JSON" | "Markdown";
  sections: string[];
  createdAt: string;
  createdBy: string;
}

export interface AlertRecord {
  alertId: string;
  severity: "critical" | "high" | "medium";
  status: "open" | "acknowledged" | "resolved";
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
