import { BenchmarkApiTransport, type TransportRequestOptions } from "../api/benchmarkApiTransport";
import {
  fixtureAttentionEvidence,
  fixtureAttentionTimeline,
  fixtureBenchmarkHistory,
  fixtureCompatibility,
  fixtureComponents,
  fixtureEnvironment,
  fixtureExecutionPlan,
  fixtureIdentityClosure,
  fixtureLease,
  fixtureMission,
  fixtureNativeAnalytics,
  fixtureNativeCoverage,
  fixtureObservation,
  fixtureReconciliationEvents,
  fixtureReconciliationJob,
  fixtureResource,
  fixtureResourceDetail,
  fixtureRunEnvironment,
  fixtureTelemetryDrift,
  fixtureTelemetrySource,
  fixtureTelemetryStatus,
  fixtureTopology,
  fixtureTrajectory,
} from "./mockData";
import type {
  AttentionEvidenceView,
  AttentionTimelineView,
  CompatibilityMatrixView,
  EnvironmentLeaseView,
  EnvironmentView,
  IdentityClosureView,
  MissionHistoryView,
  NativeAnalyticsEnvelopeView,
  NativeAnalyticsModuleView,
  NativeCapabilityView,
  NativeCoverageView,
  NativeFaultProfileView,
  NativeResourceView,
  OperationalResource,
  ProviderClosureView,
  RawTraceLinksView,
  ReconcileRequestView,
  ReconciliationEventView,
  ReconciliationJobView,
  ResourceBenchmarkHistoryView,
  ResourceBindingView,
  ResourceObservationView,
  RunEnvironmentView,
  RunExecutionPlanView,
  SystemComponentView,
  SystemTopologyView,
  TelemetryDriftView,
  TelemetrySourceView,
  TelemetryStatusView,
  TelemetryWatermarkView,
  TrajectoryView,
} from "./types";

export interface OperationalConsoleApi {
  getSystemTopology(options?: TransportRequestOptions): Promise<OperationalResource<SystemTopologyView>>;
  listSystemComponents(options?: TransportRequestOptions): Promise<OperationalResource<SystemComponentView[]>>;
  getSystemComponent(componentId: string, options?: TransportRequestOptions): Promise<OperationalResource<SystemComponentView>>;
  probeSystemComponent(componentId: string, options?: TransportRequestOptions): Promise<OperationalResource<SystemComponentView>>;
  getSystemCompatibility(options?: TransportRequestOptions): Promise<OperationalResource<CompatibilityMatrixView>>;
  listEnvironments(options?: TransportRequestOptions): Promise<OperationalResource<EnvironmentView[]>>;
  getEnvironment(environmentId: string, options?: TransportRequestOptions): Promise<OperationalResource<EnvironmentView>>;
  probeEnvironment(environmentId: string, options?: TransportRequestOptions): Promise<OperationalResource<EnvironmentView>>;
  listEnvironmentResources(environmentId: string, options?: TransportRequestOptions): Promise<OperationalResource<NativeResourceView[]>>;
  listEnvironmentFaultProfiles(environmentId: string, options?: TransportRequestOptions): Promise<OperationalResource<NativeFaultProfileView[]>>;
  listEnvironmentLeases(environmentId: string, options?: TransportRequestOptions): Promise<OperationalResource<EnvironmentLeaseView[]>>;
  listResources(options?: TransportRequestOptions): Promise<OperationalResource<NativeResourceView[]>>;
  getResource(resourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<NativeResourceView>>;
  getResourceCapabilities(resourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<NativeCapabilityView[]>>;
  getLatestResourceObservations(resourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<ResourceObservationView[]>>;
  listResourceMissions(resourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<MissionHistoryView[]>>;
  listResourceBenchmarkHistory(resourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<ResourceBenchmarkHistoryView[]>>;
  getRunExecutionPlan(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<RunExecutionPlanView>>;
  getRunNativeCoverage(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<NativeCoverageView>>;
  getRunIdentityClosure(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<IdentityClosureView>>;
  getRunTelemetryStatus(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<TelemetryStatusView>>;
  getRunEnvironment(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<RunEnvironmentView>>;
  getRunResourceBindings(runId: string, options?: TransportRequestOptions): Promise<OperationalResource<ResourceBindingView[]>>;
  reconcileRun(runId: string, input: ReconcileRequestView, options?: TransportRequestOptions): Promise<OperationalResource<ReconciliationJobView>>;
  getRepetitionTrajectory(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<TrajectoryView>>;
  getRepetitionIdentityClosure(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<IdentityClosureView>>;
  getRepetitionTelemetry(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<TelemetryStatusView>>;
  getRepetitionProviderClosure(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<ProviderClosureView>>;
  getRepetitionPhysicalObservations(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<ResourceObservationView[]>>;
  getRepetitionRawTraceLinks(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<OperationalResource<RawTraceLinksView>>;
  listReconciliationJobs(options?: TransportRequestOptions): Promise<OperationalResource<ReconciliationJobView[]>>;
  getReconciliationJob(jobId: string, options?: TransportRequestOptions): Promise<OperationalResource<ReconciliationJobView>>;
  listReconciliationJobEvents(jobId: string, options?: TransportRequestOptions): Promise<OperationalResource<ReconciliationEventView[]>>;
  cancelReconciliationJob(jobId: string, options?: TransportRequestOptions): Promise<OperationalResource<ReconciliationJobView>>;
  listTelemetrySources(options?: TransportRequestOptions): Promise<OperationalResource<TelemetrySourceView[]>>;
  getTelemetrySource(sourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<TelemetrySourceView>>;
  getTelemetryWatermarks(sourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<TelemetryWatermarkView>>;
  getTelemetryDrift(sourceId: string, options?: TransportRequestOptions): Promise<OperationalResource<TelemetryDriftView>>;
  getAttentionTimeline(attentionId: string, options?: TransportRequestOptions): Promise<OperationalResource<AttentionTimelineView>>;
  getAttentionEvidence(attentionId: string, options?: TransportRequestOptions): Promise<OperationalResource<AttentionEvidenceView>>;
  getNativeAnalytics(module: NativeAnalyticsModuleView["module"], options?: TransportRequestOptions): Promise<OperationalResource<NativeAnalyticsEnvelopeView>>;
}

export class LiveOperationalConsoleApi implements OperationalConsoleApi {
  readonly transport: BenchmarkApiTransport;

  constructor(baseUrl?: string) {
    this.transport = new BenchmarkApiTransport(baseUrl);
  }

  getSystemTopology(o?: TransportRequestOptions) { return this.get<SystemTopologyView>("/v1/system/topology", o); }
  listSystemComponents(o?: TransportRequestOptions) { return this.get<SystemComponentView[]>("/v1/system/components", o); }
  getSystemComponent(id: string, o?: TransportRequestOptions) { return this.get<SystemComponentView>(`/v1/system/components/${part(id)}`, o); }
  probeSystemComponent(id: string, o?: TransportRequestOptions) { return this.post<SystemComponentView>(`/v1/system/components/${part(id)}/probe`, {}, o); }
  getSystemCompatibility(o?: TransportRequestOptions) { return this.get<CompatibilityMatrixView>("/v1/system/compatibility", o); }
  listEnvironments(o?: TransportRequestOptions) { return this.get<EnvironmentView[]>("/v1/environments", o); }
  getEnvironment(id: string, o?: TransportRequestOptions) { return this.get<EnvironmentView>(`/v1/environments/${part(id)}`, o); }
  probeEnvironment(id: string, o?: TransportRequestOptions) { return this.post<EnvironmentView>(`/v1/environments/${part(id)}/probe`, {}, o); }
  listEnvironmentResources(id: string, o?: TransportRequestOptions) { return this.get<NativeResourceView[]>(`/v1/environments/${part(id)}/resources`, o); }
  listEnvironmentFaultProfiles(id: string, o?: TransportRequestOptions) { return this.get<NativeFaultProfileView[]>(`/v1/environments/${part(id)}/fault-profiles`, o); }
  listEnvironmentLeases(id: string, o?: TransportRequestOptions) { return this.get<EnvironmentLeaseView[]>(`/v1/environments/${part(id)}/leases`, o); }
  listResources(o?: TransportRequestOptions) { return this.get<NativeResourceView[]>("/v1/resources", o); }
  getResource(id: string, o?: TransportRequestOptions) { return this.get<NativeResourceView>(`/v1/resources/${part(id)}`, o); }
  getResourceCapabilities(id: string, o?: TransportRequestOptions) { return this.get<NativeCapabilityView[]>(`/v1/resources/${part(id)}/capabilities`, o); }
  getLatestResourceObservations(id: string, o?: TransportRequestOptions) { return this.get<ResourceObservationView[]>(`/v1/resources/${part(id)}/observations/latest`, o); }
  listResourceMissions(id: string, o?: TransportRequestOptions) { return this.get<MissionHistoryView[]>(`/v1/resources/${part(id)}/missions`, o); }
  listResourceBenchmarkHistory(id: string, o?: TransportRequestOptions) { return this.get<ResourceBenchmarkHistoryView[]>(`/v1/resources/${part(id)}/benchmark-history`, o); }
  getRunExecutionPlan(id: string, o?: TransportRequestOptions) { return this.get<RunExecutionPlanView>(runPath(id, "execution-plan"), o); }
  getRunNativeCoverage(id: string, o?: TransportRequestOptions) { return this.get<NativeCoverageView>(runPath(id, "native-coverage"), o); }
  getRunIdentityClosure(id: string, o?: TransportRequestOptions) { return this.get<IdentityClosureView>(runPath(id, "identity-closure"), o); }
  getRunTelemetryStatus(id: string, o?: TransportRequestOptions) { return this.get<TelemetryStatusView>(runPath(id, "telemetry-status"), o); }
  getRunEnvironment(id: string, o?: TransportRequestOptions) { return this.get<RunEnvironmentView>(runPath(id, "environment"), o); }
  getRunResourceBindings(id: string, o?: TransportRequestOptions) { return this.get<ResourceBindingView[]>(runPath(id, "resource-bindings"), o); }
  reconcileRun(id: string, input: ReconcileRequestView, o?: TransportRequestOptions) { return this.post<ReconciliationJobView>(runPath(id, "reconcile"), input, o); }
  getRepetitionTrajectory(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<TrajectoryView>(repetitionPath(runId, repetitionId, "trajectory"), o); }
  getRepetitionIdentityClosure(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<IdentityClosureView>(repetitionPath(runId, repetitionId, "identity-closure"), o); }
  getRepetitionTelemetry(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<TelemetryStatusView>(repetitionPath(runId, repetitionId, "telemetry"), o); }
  getRepetitionProviderClosure(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<ProviderClosureView>(repetitionPath(runId, repetitionId, "provider-closure"), o); }
  getRepetitionPhysicalObservations(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<ResourceObservationView[]>(repetitionPath(runId, repetitionId, "physical-observations"), o); }
  getRepetitionRawTraceLinks(runId: string, repetitionId: string, o?: TransportRequestOptions) { return this.get<RawTraceLinksView>(repetitionPath(runId, repetitionId, "raw-trace-links"), o); }
  listReconciliationJobs(o?: TransportRequestOptions) { return this.get<ReconciliationJobView[]>("/v1/reconciliation-jobs", o); }
  getReconciliationJob(id: string, o?: TransportRequestOptions) { return this.get<ReconciliationJobView>(`/v1/reconciliation-jobs/${part(id)}`, o); }
  listReconciliationJobEvents(id: string, o?: TransportRequestOptions) { return this.get<ReconciliationEventView[]>(`/v1/reconciliation-jobs/${part(id)}/events`, o); }
  cancelReconciliationJob(id: string, o?: TransportRequestOptions) { return this.post<ReconciliationJobView>(`/v1/reconciliation-jobs/${part(id)}/cancel`, {}, o); }
  listTelemetrySources(o?: TransportRequestOptions) { return this.get<TelemetrySourceView[]>("/v1/telemetry-sources", o); }
  getTelemetrySource(id: string, o?: TransportRequestOptions) { return this.get<TelemetrySourceView>(`/v1/telemetry-sources/${part(id)}`, o); }
  getTelemetryWatermarks(id: string, o?: TransportRequestOptions) { return this.get<TelemetryWatermarkView>(`/v1/telemetry-sources/${part(id)}/watermarks`, o); }
  getTelemetryDrift(id: string, o?: TransportRequestOptions) { return this.get<TelemetryDriftView>(`/v1/telemetry-sources/${part(id)}/drift`, o); }
  getAttentionTimeline(id: string, o?: TransportRequestOptions) { return this.get<AttentionTimelineView>(`/v1/attention-items/${part(id)}/timeline`, o); }
  getAttentionEvidence(id: string, o?: TransportRequestOptions) { return this.get<AttentionEvidenceView>(`/v1/attention-items/${part(id)}/evidence`, o); }
  getNativeAnalytics(module: NativeAnalyticsModuleView["module"], o?: TransportRequestOptions) { return this.get<NativeAnalyticsEnvelopeView>(`/v1/analytics/${module}`, o); }

  private async get<T>(path: string, options?: TransportRequestOptions) {
    return requireOperationalData(await this.transport.get<Omit<OperationalResource<T>, "data"> & { data: T | null }>(path, options));
  }

  private async post<T>(path: string, body: unknown, options?: TransportRequestOptions) {
    return requireOperationalData(await this.transport.post<Omit<OperationalResource<T>, "data"> & { data: T | null }>(path, body, options));
  }
}

export class FixtureOperationalConsoleApi implements OperationalConsoleApi {
  async getSystemTopology() { return fixtureResource(fixtureTopology); }
  async listSystemComponents() { return fixtureResource(fixtureComponents); }
  async getSystemComponent(id: string) { return fixtureResource(fixtureComponents.find((item) => item.componentId === id) ?? { ...fixtureComponents[0], componentId: id, displayName: id, health: "unknown" as const, readiness: "unknown" as const, reasonCodes: ["COMPONENT_NOT_IN_FIXTURE"] }); }
  async probeSystemComponent(id: string) { return this.getSystemComponent(id); }
  async getSystemCompatibility() { return fixtureResource(fixtureCompatibility); }
  async listEnvironments() { return fixtureResource([fixtureEnvironment]); }
  async getEnvironment(id: string) { return fixtureResource({ ...fixtureEnvironment, environmentId: id }); }
  async probeEnvironment(id: string) { return this.getEnvironment(id); }
  async listEnvironmentResources() { return fixtureResource([fixtureResourceDetail]); }
  async listEnvironmentFaultProfiles() { return fixtureResource<NativeFaultProfileView[]>([
    { faultProfileId: "stale-state/v1", owner: "simulator", available: true, dataClass: "development_native_test_fault", contractRef: "simulator:fault-profile/v1", reasonCodes: [] },
    { faultProfileId: "control-success-physical-no-effect/v1", owner: "simulator", available: true, dataClass: "development_native_test_fault", contractRef: "simulator:fault-profile/v1", reasonCodes: [] },
  ]); }
  async listEnvironmentLeases() { return fixtureResource([fixtureLease]); }
  async listResources() { return fixtureResource([fixtureResourceDetail]); }
  async getResource(id: string) { return fixtureResource({ ...fixtureResourceDetail, resourceId: id }); }
  async getResourceCapabilities() { return fixtureResource<NativeCapabilityView[]>([{ capabilityId: "vehicle_navigate", operationName: "vehicle_navigate", availability: "available", native: true, contractRef: "smpp:vehicle/v1", sourceRef: "smpp-runtime", reasonCodes: [] }]); }
  async getLatestResourceObservations() { return fixtureResource([fixtureObservation]); }
  async listResourceMissions() { return fixtureResource([fixtureMission]); }
  async listResourceBenchmarkHistory() { return fixtureResource([fixtureBenchmarkHistory]); }
  async getRunExecutionPlan(runId: string) { return fixtureResource({ ...fixtureExecutionPlan, runId }); }
  async getRunNativeCoverage(runId: string) { return fixtureResource({ ...fixtureNativeCoverage, runId }); }
  async getRunIdentityClosure(runId: string) { return fixtureResource({ ...fixtureIdentityClosure, runId }); }
  async getRunTelemetryStatus(runId: string) { return fixtureResource({ ...fixtureTelemetryStatus, runId }); }
  async getRunEnvironment(runId: string) { return fixtureResource({ ...fixtureRunEnvironment, runId }); }
  async getRunResourceBindings(runId: string) { return fixtureResource<ResourceBindingView[]>([{ bindingId: "binding-fixture-001", runId, resourceId: fixtureResourceDetail.resourceId, revision: 1, status: "released", sourceRef: "fixture:resource-binding", reasonCodes: [] }]); }
  async reconcileRun(runId: string, _input: ReconcileRequestView) { return fixtureResource({ ...fixtureReconciliationJob, runId }); }
  async getRepetitionTrajectory(runId: string, repetitionId: string) { return fixtureResource({ ...fixtureTrajectory, runId, repetitionId }); }
  async getRepetitionIdentityClosure(runId: string, repetitionId: string) { return fixtureResource({ ...fixtureIdentityClosure, runId, repetitionId, scope: "repetition" as const }); }
  async getRepetitionTelemetry(runId: string, repetitionId: string) { return fixtureResource({ ...fixtureTelemetryStatus, runId, repetitionId, scope: "repetition" as const }); }
  async getRepetitionProviderClosure(runId: string, repetitionId: string) { return fixtureResource<ProviderClosureView>({ runId, repetitionId, status: "ready", mcpTask: { identity: "mcp-task-fixture-001", sourceRef: "fixture:smpp-task" }, providerExecutions: [{ identity: fixtureMission.externalExecutionId ?? "provider-execution-fixture-001", sourceRef: "fixture:provider-execution" }], deviceMissions: [{ identity: fixtureMission.missionId, sourceRef: fixtureMission.sourceRef }], facts: [], relations: [], readiness: { expectedFactCount: 105, selectedFactCount: 105, foreignFactCount: 0, unresolvedBindingCount: 0, truncated: false, hasMore: false, hintsUsedForAuthority: false } }); }
  async getRepetitionPhysicalObservations() { return fixtureResource([fixtureObservation]); }
  async getRepetitionRawTraceLinks(runId: string, repetitionId: string) { return fixtureResource<RawTraceLinksView>({ runId, repetitionId, links: [{ sourceId: fixtureTelemetrySource.sourceId, traceId: "trace-fixture-001", queryParameters: { runId, repetitionId }, availableFrom: fixtureTelemetrySource.timestamps.lastObservedAt, availableUntil: null }] }); }
  async listReconciliationJobs() { return fixtureResource([fixtureReconciliationJob]); }
  async getReconciliationJob(id: string) { return fixtureResource({ ...fixtureReconciliationJob, jobId: id }); }
  async listReconciliationJobEvents() { return fixtureResource(fixtureReconciliationEvents); }
  async cancelReconciliationJob(id: string) { return fixtureResource({ ...fixtureReconciliationJob, jobId: id, state: "cancelled" as const, completedAt: new Date().toISOString() }); }
  async listTelemetrySources() { return fixtureResource([fixtureTelemetrySource]); }
  async getTelemetrySource(id: string) { return fixtureResource({ ...fixtureTelemetrySource, sourceId: id }); }
  async getTelemetryWatermarks(id: string) { return fixtureResource<TelemetryWatermarkView>({ sourceId: id, observed: fixtureTelemetrySource.timestamps.lastObservedAt, received: fixtureTelemetrySource.timestamps.lastReceivedAt, ingested: fixtureTelemetrySource.timestamps.lastIngestedAt, projected: fixtureTelemetrySource.timestamps.lastProjectedAt, lags: { observedToReceivedMs: 21, receivedToIngestedMs: 28, ingestedToProjectedMs: 42 }, reasonCodes: [] }); }
  async getTelemetryDrift(id: string) { return fixtureResource({ ...fixtureTelemetryDrift, sourceId: id }); }
  async getAttentionTimeline(id: string) { return fixtureResource(fixtureAttentionTimeline.map((event) => ({ ...event, payload: { ...(event.payload ?? {}), attentionId: id } }))); }
  async getAttentionEvidence(id: string) { return fixtureResource({ ...fixtureAttentionEvidence, attentionId: id }); }
  async getNativeAnalytics(module: NativeAnalyticsModuleView["module"]) { return fixtureResource({ ...fixtureNativeAnalytics[module], module }); }
}

function readViteEnv(name: string): string | undefined {
  return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[name];
}

function createOperationalApi(): OperationalConsoleApi {
  const mode = readViteEnv("VITE_API_MODE");
  if (mode === "http" || mode === "msw") return new LiveOperationalConsoleApi(mode === "msw" ? "" : undefined);
  return new FixtureOperationalConsoleApi();
}

function part(value: string) { return encodeURIComponent(value); }
function runPath(runId: string, suffix: string) { return `/v1/benchmark-runs/${part(runId)}/${suffix}`; }
function repetitionPath(runId: string, repetitionId: string, suffix: string) { return `/v1/benchmark-runs/${part(runId)}/repetitions/${part(repetitionId)}/${suffix}`; }

function requireOperationalData<T>(resource: Omit<OperationalResource<T>, "data"> & { data: T | null }): OperationalResource<T> {
  if (resource.data !== null) return { data: resource.data, meta: resource.meta };
  const reasons = resource.meta?.reasonCodes?.join(" · ") || "OPERATIONAL_DATA_UNAVAILABLE";
  throw new Error(`${resource.meta?.availability ?? "unavailable"}: ${reasons}`);
}

export const operationalApi = createOperationalApi();
