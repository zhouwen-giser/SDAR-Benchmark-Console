import type {
  AttentionEvidenceView,
  AttentionTimelineView,
  CompatibilityMatrixView,
  EnvironmentLeaseView,
  EnvironmentView,
  IdentityClosureView,
  MissionHistoryView,
  NativeAnalyticsEnvelopeView,
  NativeCoverageView,
  NativeResourceView,
  OperationalMeta,
  OperationalResource,
  ReconciliationEventView,
  ReconciliationJobView,
  ResourceBenchmarkHistoryView,
  ResourceObservationView,
  RunEnvironmentView,
  RunExecutionPlanView,
  SystemComponentView,
  SystemTopologyView,
  TelemetryDriftView,
  TelemetrySourceView,
  TelemetryStatusView,
  TrajectoryView,
} from "./types";

const generatedAt = "2026-09-03T04:00:00.000Z";

export function fixtureMeta(overrides: Partial<OperationalMeta> = {}): OperationalMeta {
  return {
    schemaVersion: "sdar-benchmark.resource-envelope/v1",
    generatedAt,
    authority: "composite",
    dataClass: "development_fixture",
    availability: "available",
    formalEligible: false,
    revision: 1,
    watermark: generatedAt,
    projectionLagMs: 1200,
    sourceRefs: ["fixture:live-native-v0.3"],
    reasonCodes: [],
    unavailableFields: [],
    warnings: ["CONTRACT_FIXTURE_NOT_LIVE_NATIVE_EVIDENCE"],
    ...overrides,
  };
}

export function fixtureResource<T>(data: T, meta: Partial<OperationalMeta> = {}): OperationalResource<T> {
  return { data: structuredClone(data), meta: fixtureMeta(meta) };
}

export const fixtureComponents: SystemComponentView[] = [
  {
    componentId: "benchmark-api",
    componentType: "benchmark_server",
    displayName: "Benchmark API",
    repository: "zhouwen-giser/sdar-benchmark-server",
    branch: "feature/benchmark-live-native-operations-v0.3",
    commit: null,
    version: "0.3.0-dev",
    imageDigest: null,
    endpoint: "/benchmark-api",
    health: "healthy",
    readiness: "ready",
    lastSeenAt: generatedAt,
    latencyMs: 4,
    contracts: ["sdar-benchmark.resource-envelope/v1"],
    capabilities: ["run-authority", "sse", "reconciliation"],
    reasonCodes: [],
  },
  {
    componentId: "sdar-runtime",
    componentType: "agent_runtime",
    displayName: "SDAR Runtime",
    repository: "zhouwen-giser/skill-driven-agent-runtime",
    branch: "codex/smpp-mcp-tasks-consumer-sync-v0.1",
    commit: "0a73800b8991da50bea13b03f4f39670cf29da10",
    version: null,
    imageDigest: null,
    endpoint: "registry:sdar-runtime-dev",
    health: "healthy",
    readiness: "ready",
    lastSeenAt: generatedAt,
    latencyMs: 12,
    contracts: ["a2a", "sdar.evidence/v1"],
    capabilities: ["logical-invocation-identity", "provider-lineage", "exact-reconcile"],
    reasonCodes: [],
  },
  {
    componentId: "ugv-simulator",
    componentType: "simulator",
    displayName: "UGV Simulator / Referee",
    repository: "local:isr-simulation",
    branch: "master",
    commit: "c106205",
    version: null,
    imageDigest: null,
    endpoint: "registry:ugv-simulator-dev",
    health: "degraded",
    readiness: "partial",
    lastSeenAt: generatedAt,
    latencyMs: 21,
    contracts: ["referee.socketio.state"],
    capabilities: ["physical-observation"],
    reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"],
  },
];

export const fixtureTopology: SystemTopologyView = {
  topologyRevision: 1,
  generatedAt,
  nodes: fixtureComponents,
  edges: [
    { edgeId: "console-api", from: "benchmark-console", to: "benchmark-api", protocol: "HTTP/SSE", status: "ready", lastSuccessAt: generatedAt, watermark: generatedAt, reasonCodes: [] },
    { edgeId: "api-runtime", from: "benchmark-api", to: "sdar-runtime", protocol: "A2A HTTP", status: "ready", lastSuccessAt: generatedAt, watermark: generatedAt, reasonCodes: [] },
    { edgeId: "runtime-simulator", from: "sdar-runtime", to: "ugv-simulator", protocol: "MCP Tasks / Provider", status: "degraded", lastSuccessAt: null, watermark: null, reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"] },
  ],
  overallStatus: "degraded",
  nativeExecutionReady: false,
  reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"],
};

export const fixtureCompatibility: CompatibilityMatrixView = {
  generatedAt,
  relations: [
    { producer: "sdar-runtime", consumer: "benchmark-api", contract: "sdar.evidence/v1", expectedVersion: "v1", observedVersion: "v1", expectedHash: null, observedHash: null, status: "exact", reasonCodes: [] },
    { producer: "ugv-referee", consumer: "benchmark-api", contract: "referee.socketio.state", expectedVersion: null, observedVersion: null, expectedHash: null, observedHash: null, status: "unresolved", reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"] },
  ],
};

export const fixtureEnvironment: EnvironmentView = {
  environmentId: "ugv-simulator-dev",
  environmentVersion: "0.3.0-local",
  kind: "simulator",
  repositoryRef: "local:isr-simulation@c106205",
  buildRef: null,
  imageDigest: null,
  controlEndpointComponentId: "ugv-simulator",
  refereeEndpointComponentId: "ugv-referee",
  telemetrySourceIds: ["smpp-telemetry-main", "sdar-telemetry-main"],
  resourceCount: 1,
  activeMissionCount: 0,
  uncertainTaskCount: 0,
  leaseStatus: "available",
  nativeCapabilities: ["control", "ground-truth", "trajectory"],
  supportedFaultProfiles: ["stale-state/v1", "control-success-physical-no-effect/v1"],
  lastProbeAt: generatedAt,
  lastCleanupAt: null,
  reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"],
};

export const fixtureResourceDetail: NativeResourceView = {
  resourceId: "vehicle:ugv1",
  resourceType: "ugv",
  environmentId: fixtureEnvironment.environmentId,
  providerId: "isr.vehicle.ugv.ugv1",
  providerInstanceId: "smpp-runtime-postgres-authority",
  providerOperations: ["vehicle_get_state", "vehicle_navigate"],
  availability: "available",
  position: { frame: "LOCAL_ENU", x: -340.18, y: 109.45 },
  speedMps: 0,
  positionAccuracyM: 0.5,
  observationTimes: {
    sourceObservedAt: generatedAt,
    receivedAt: generatedAt,
    ingestedAt: generatedAt,
    projectedAt: generatedAt,
  },
  activeMissionId: null,
  activeMcpTaskId: null,
  activeBenchmarkRunId: null,
  capabilities: ["state-read", "navigate"],
  reasonCodes: [],
};

export const fixtureLease: EnvironmentLeaseView = {
  leaseId: "lease-fixture-001",
  environmentId: fixtureEnvironment.environmentId,
  runId: "run-fixture-native-001",
  state: "released",
  createdAt: "2026-09-03T03:30:00.000Z",
  expiresAt: "2026-09-03T03:45:00.000Z",
  fenceToken: "fixture-fence-token-001",
  reasonCodes: [],
};

export const fixtureObservation: ResourceObservationView = {
  observationId: "observation-fixture-001",
  resourceId: fixtureResourceDetail.resourceId,
  missionId: null,
  kind: "ground_truth_pose",
  sourceObservedAt: generatedAt,
  receivedAt: generatedAt,
  ingestedAt: generatedAt,
  projectedAt: generatedAt,
  sourceRef: "fixture:referee.socketio.state",
  accuracyM: 0.5,
  sequence: 1,
  payload: { frame: "LOCAL_ENU", x: -340.18, y: 109.45, speedMps: 0 },
};

export const fixtureMission: MissionHistoryView = {
  missionId: "mission-fixture-001",
  resourceId: fixtureResourceDetail.resourceId,
  state: "completed",
  current: false,
  externalExecutionId: "provider-execution-fixture-001",
  benchmarkRunId: "run-fixture-native-001",
  sourceObservedAt: generatedAt,
  sourceRef: "fixture:providerops-mission",
  reasonCodes: [],
};

export const fixtureBenchmarkHistory: ResourceBenchmarkHistoryView = {
  runId: "run-fixture-native-001",
  resourceId: fixtureResourceDetail.resourceId,
  caseCount: 4,
  terminalCount: 4,
  startedAt: "2026-09-03T03:59:00.000Z",
  terminalAt: generatedAt,
  nativeCoverage: "native",
  reasonCodes: [],
};

export const fixtureExecutionPlan: RunExecutionPlanView = {
  runId: fixtureBenchmarkHistory.runId,
  candidateSnapshotRef: "sdar-ugv-agent-diagnostic:0.3:native-candidate",
  datasetVersionRef: "sdar-ugv-agent-diagnostic:0.2:dataset-version",
  caseOrder: ["UGV-NODE-001", "UGV-CORE-001", "UGV-MCP-003", "UGV-XCHAIN-003"],
  repeatCount: 1,
  environmentRef: fixtureEnvironment.environmentId,
  resourceSelectors: [{ resourceId: fixtureResourceDetail.resourceId }],
  executionTarget: "live_native",
  nativeRequirement: "require_native",
  telemetryPolicy: "require_full",
  observationTimePolicy: "require_source_observed_at",
  reconciliationPolicy: "automatic",
  streamingEnabled: true,
  faultProfiles: ["response-loss-after-durable-dispatch/v1", "control-success-physical-no-effect/v1"],
  cleanupPolicy: "verify_zero_active_mission",
  contentHash: `sha256:${"3".repeat(64)}`,
};

export const fixtureNativeCoverage: NativeCoverageView = {
  runId: fixtureExecutionPlan.runId,
  overall: "native",
  nativeLayerCount: 9,
  substitutedLayerCount: 0,
  unavailableLayerCount: 0,
  layers: [
    { layer: "candidate", status: "native", sourceRef: "runtime:a2a-task-fixture", reasonCodes: [] },
    { layer: "runtime", status: "native", sourceRef: "runtime:goal-fixture", reasonCodes: [] },
    { layer: "mcp_tasks", status: "native_test_fault", sourceRef: "smpp:fault-fixture", reasonCodes: [] },
    { layer: "provider", status: "native", sourceRef: "provider:execution-fixture", reasonCodes: [] },
    { layer: "physical_truth", status: "native", sourceRef: "referee:trajectory-fixture", reasonCodes: [] },
  ],
  formalEligible: false,
};

export const fixtureIdentityClosure: IdentityClosureView = {
  scope: "run",
  runId: fixtureExecutionPlan.runId,
  repetitionId: null,
  nodes: [
    { nodeId: "rep", kind: "repetition", identity: "repetition-fixture-core-001", authority: "benchmark_postgresql", sourceRef: "pg:repetition" },
    { nodeId: "task", kind: "a2a_task", identity: "a2a-task-fixture", authority: "runtime", sourceRef: "runtime:task" },
    { nodeId: "mission", kind: "device_mission", identity: fixtureMission.missionId, authority: "providerops", sourceRef: "provider:mission" },
  ],
  edges: [
    { edgeId: "rep-task", from: "rep", to: "task", kind: "repetition_to_a2a_task", status: "exact", authority: "benchmark_postgresql+runtime", matchCount: 1, sourceRefs: ["pg:repetition", "runtime:task"], reasonCodes: [] },
    { edgeId: "task-mission", from: "task", to: "mission", kind: "a2a_task_to_device_mission", status: "exact", authority: "runtime+smpp+providerops", matchCount: 1, sourceRefs: ["runtime:binding", "smpp:task", "provider:mission"], reasonCodes: [] },
  ],
  overallStatus: "exact",
  reasonCodes: [],
};

export const fixtureTelemetryStatus: TelemetryStatusView = {
  scope: "run",
  runId: fixtureExecutionPlan.runId,
  repetitionId: null,
  sources: [
    { sourceId: "smpp-telemetry-main", sourceType: "providerops", status: "ready", factCount: 105, relationCount: 8, watermark: generatedAt, lags: { observedToReceivedMs: 18, receivedToIngestedMs: 22, ingestedToProjectedMs: 36, projectedToEvaluationMs: 41 }, reasonCodes: [] },
    { sourceId: "sdar-telemetry-main", sourceType: "canonical", status: "partial", factCount: 105, relationCount: 8, watermark: generatedAt, lags: { observedToReceivedMs: 21, receivedToIngestedMs: 28, ingestedToProjectedMs: 42, projectedToEvaluationMs: 49 }, reasonCodes: ["PROVIDER_CLOSURE_V2_REQUALIFICATION_PENDING"] },
  ],
  overallStatus: "partial",
  reasonCodes: ["PROVIDER_CLOSURE_V2_REQUALIFICATION_PENDING"],
};

export const fixtureRunEnvironment: RunEnvironmentView = {
  runId: fixtureExecutionPlan.runId,
  environment: fixtureEnvironment,
  lease: fixtureLease,
  cleanupStatus: "complete",
  reasonCodes: [],
};

export const fixtureTrajectory: TrajectoryView = {
  runId: fixtureExecutionPlan.runId,
  repetitionId: "repetition-fixture-core-001",
  coordinateFrame: "LOCAL_ENU",
  start: { x: 0, y: 0 },
  target: { x: 12, y: 4 },
  final: { x: 11.8, y: 4.1 },
  toleranceM: 0.5,
  samples: [
    { sequence: 0, position: { x: 0, y: 0 }, speedMps: 0, missionState: "accepted", sourceObservedAt: "2026-09-03T03:59:30.000Z", receivedAt: "2026-09-03T03:59:30.018Z", accuracyM: 0.5 },
    { sequence: 1, position: { x: 5, y: 2 }, speedMps: 1.2, missionState: "running", sourceObservedAt: "2026-09-03T03:59:40.000Z", receivedAt: "2026-09-03T03:59:40.021Z", accuracyM: 0.5 },
    { sequence: 2, position: { x: 11.8, y: 4.1 }, speedMps: 0, missionState: "completed", sourceObservedAt: generatedAt, receivedAt: generatedAt, accuracyM: 0.5 },
  ],
  gaps: [],
  downsampled: false,
  fullArtifactRef: "artifact:trajectory-fixture-001",
};

export const fixtureTelemetrySource: TelemetrySourceView = {
  sourceId: "sdar-telemetry-main",
  sourceType: "canonical_and_provider_closure",
  componentId: "sdar-telemetry",
  environmentId: fixtureEnvironment.environmentId,
  contractVersion: "provider-closure/v2",
  schemaHash: `sha256:${"4".repeat(64)}`,
  sourceIdentity: "environment-scoped",
  timestamps: { lastObservedAt: generatedAt, lastReceivedAt: generatedAt, lastIngestedAt: generatedAt, lastProjectedAt: generatedAt },
  lags: { projectionLagMs: 1200 },
  counts: { factCount: 105, relationCount: 8, conflictCount: 0, lateCount: 0, unresolvedCount: 0 },
  status: "ready",
  reasonCodes: [],
};

export const fixtureTelemetryDrift: TelemetryDriftView = {
  sourceId: fixtureTelemetrySource.sourceId,
  expectedContract: { version: "provider-closure/v2" },
  observedContract: { version: "provider-closure/v2" },
  compatibilityStatus: "exact",
  missingFields: [],
  extraFields: [],
  typeMismatches: [],
  firstDetectedAt: null,
  lastDetectedAt: null,
  affectedRuns: [],
};

export const fixtureReconciliationJob: ReconciliationJobView = {
  jobId: "reconcile-fixture-001",
  runId: fixtureExecutionPlan.runId,
  repetitionId: null,
  type: "composite",
  state: "completed",
  scopes: ["candidate", "mcp_task", "provider_closure", "telemetry", "evaluation_input", "projection"],
  sideEffectPolicy: "no_new_physical_side_effect",
  createdAt: "2026-09-03T04:00:00.000Z",
  updatedAt: "2026-09-03T04:00:01.000Z",
  completedAt: "2026-09-03T04:00:01.000Z",
  reasonCodes: [],
  result: { recoveredRelations: 1, duplicatesPrevented: 1, physicalSideEffectsCreated: 0 },
};

export const fixtureReconciliationEvents: ReconciliationEventView[] = [
  { eventId: "reconcile-event-1", jobId: fixtureReconciliationJob.jobId, revision: 1, eventType: "reconciliation.running", occurredAt: fixtureReconciliationJob.createdAt, reasonCodes: [] },
  { eventId: "reconcile-event-2", jobId: fixtureReconciliationJob.jobId, revision: 2, eventType: "reconciliation.completed", occurredAt: fixtureReconciliationJob.completedAt!, reasonCodes: [] },
];

export const fixtureAttentionTimeline: AttentionTimelineView = [{ eventId: "attention-event-1", eventType: "attention.changed", runId: "run-fixture-native-001", repetitionId: null, authorityRevision: 1, occurredAt: generatedAt, receivedAt: generatedAt, source: "benchmark-postgresql", dataClass: "development_fixture", payload: { attentionId: "attention-fixture-001", reasonCodes: ["CONTRACT_DRIFT"] }, payloadRef: null }];

export const fixtureAttentionEvidence: AttentionEvidenceView = {
  attentionId: "attention-fixture-001",
  subjects: [{ kind: "component", id: "ugv-simulator" }],
  evidenceRefs: ["artifact:component-probe-fixture"],
  timelineRefs: ["reconcile-event-1"],
  reasonCodes: ["REMOTE_BUILD_IDENTITY_UNRESOLVED"],
};

export const fixtureNativeAnalytics: Record<string, NativeAnalyticsEnvelopeView> = {
  "native-coverage": { module: "native-coverage", rows: [{ rowId: "coverage-runtime", status: "native", value: 1, sourceRefs: ["fixture:native-coverage"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
  "telemetry-lag": { module: "telemetry-lag", rows: [{ rowId: "lag-projection", status: "ready", value: 42, sourceRefs: ["fixture:telemetry"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
  reconciliation: { module: "reconciliation", rows: [{ rowId: "reconcile-composite", status: "completed", value: 1, sourceRefs: ["fixture:reconciliation"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
  "identity-closure": { module: "identity-closure", rows: [{ rowId: "closure-exact", status: "exact", value: 1, sourceRefs: ["fixture:identity"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
  "environment-reliability": { module: "environment-reliability", rows: [{ rowId: "environment-ready", status: "ready", value: 1, sourceRefs: ["fixture:environment"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
  "physical-verification": { module: "physical-verification", rows: [{ rowId: "arrival-proof", status: "ready", value: 1, sourceRefs: ["fixture:physical-observation"], reasonCodes: [] }], availability: "available", dataClass: "development_fixture", watermark: generatedAt, reasonCodes: [], generatedAt },
};
