import type {
  AttentionEvidence,
  CompatibilityMatrix,
  CompatibilityRelation,
  EnvironmentDetail,
  EnvironmentLease,
  FaultProfile,
  IdentityClosure,
  IdentityEdge,
  LiveNativeResourceMetadata,
  NativeAnalyticsEnvelope,
  NativeAnalyticsEnvelopeModule,
  NativeCoverage,
  NativeCoverageLayer,
  NativeCoverageLayerStatus,
  PhysicalObservation,
  ProviderClosure,
  RawTraceLinks,
  ReconcileRequest,
  ReconciliationJob,
  ReconciliationJobEvent,
  ResourceBenchmarkHistory,
  ResourceBinding,
  ResourceCapability,
  ResourceDetail,
  ResourceMission,
  ResourceObservationTimes,
  RunEnvironment,
  RunExecutionPlan,
  RunStreamEvent,
  SystemComponent,
  SystemTopology,
  SystemTopologyEdge,
  TelemetryDrift,
  TelemetrySource,
  TelemetryStageLags,
  TelemetryStatus,
  TelemetryStatusSource,
  TelemetryWatermarks,
  Trajectory,
  TrajectorySample,
} from "../api/generated/model";

/**
 * Console-facing names intentionally alias the generated 172-operation v0.3
 * contract. Pages may add presentation logic, but do not redefine wire DTOs.
 */
export type OperationalMeta = LiveNativeResourceMetadata;
export type OperationalAvailability = LiveNativeResourceMetadata["availability"];
export type NativeDataClass = LiveNativeResourceMetadata["dataClass"];

export interface OperationalResource<T> {
  data: T;
  meta: OperationalMeta;
}

export type SystemComponentView = SystemComponent;
export type TopologyEdgeView = SystemTopologyEdge;
export type SystemTopologyView = SystemTopology;
export type CompatibilityRelationView = CompatibilityRelation;
export type CompatibilityMatrixView = CompatibilityMatrix;
export type EnvironmentView = EnvironmentDetail;
export type ObservationTimesView = ResourceObservationTimes;
export type NativeResourceView = ResourceDetail;
export type EnvironmentLeaseView = EnvironmentLease;
export type NativeFaultProfileView = FaultProfile;
export type NativeCapabilityView = ResourceCapability;
export type ResourceObservationView = PhysicalObservation;
export type MissionHistoryView = ResourceMission;
export type ResourceBenchmarkHistoryView = ResourceBenchmarkHistory;
export type NativeLayerStatus = NativeCoverageLayerStatus;
export type NativeCoverageLayerView = NativeCoverageLayer;
export type NativeCoverageView = NativeCoverage;
export type IdentityEdgeView = IdentityEdge;
export type IdentityClosureView = IdentityClosure;
export type TelemetryLagView = TelemetryStageLags;
export type TelemetrySourceStatusView = TelemetryStatusSource;
export type TelemetryStatusView = TelemetryStatus;
export type RunExecutionPlanView = RunExecutionPlan;
export type RunEnvironmentView = RunEnvironment;
export type ResourceBindingView = ResourceBinding;
export type RunStreamEventView = RunStreamEvent;
export type TrajectorySampleView = TrajectorySample;
export type TrajectoryView = Trajectory;
export type ProviderClosureView = ProviderClosure;
export type RawTraceLinksView = RawTraceLinks;
export type ReconciliationJobView = ReconciliationJob;
export type ReconcileRequestView = ReconcileRequest;
export type ReconciliationEventView = ReconciliationJobEvent;
export type TelemetrySourceView = TelemetrySource;
export type TelemetryDriftView = TelemetryDrift;
export type TelemetryWatermarkView = TelemetryWatermarks;
export type AttentionTimelineView = RunStreamEvent[];
export type AttentionEvidenceView = AttentionEvidence;
export type NativeAnalyticsEnvelopeView = NativeAnalyticsEnvelope;

export type NativeAnalyticsModuleView = {
  module: NativeAnalyticsEnvelopeModule;
  rows: NativeAnalyticsEnvelope["rows"];
};
