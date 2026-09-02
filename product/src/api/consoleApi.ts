import { capabilityMeta } from "./capability-map";
import { LiveHttpConsoleApi } from "./httpConsoleApi";
import type { TransportRequestOptions } from "./benchmarkApiTransport";
import type {
  BenchmarkRunStatus,
  CreateBenchmarkRun,
  DevelopmentRunPreflight,
  DevelopmentRunPreset,
  DevelopmentSubstitution,
  DiagnosticArtifact,
  DiagnosticQualification,
  DiagnosticRepetition,
  RunEvent,
  RunRepetition,
} from "./generated/model";
import {
  buildOverview,
  buildRunDashboard,
  caseResults,
  comparisonDetail,
  runSummaries,
} from "../mocks/mockData";
import {
  alertRecords,
  buildCaseDetail,
  buildEvaluationDetail,
  buildEvidenceDetail,
  evaluationSummaries,
  evidenceBundleSummaries,
  getResourceDetail,
  reportRecords,
  systemWorkspace,
} from "../mocks/extendedData";
import type {
  AlertRecord,
  AnalyticsModuleView,
  ApiResource,
  CaseDetail,
  CaseResult,
  ComparisonDetail,
  ContextOptionsView,
  EvaluationDetail,
  EvaluationDimensionView,
  EvaluationEvidenceGradeView,
  EvaluationEvidenceLinksView,
  EvaluationFatalView,
  EvaluationFindingView,
  EvaluationHardGateView,
  EvaluationHeaderView,
  EvaluationInputMaterialView,
  EvaluationInputSnapshotView,
  EvaluationMetricView,
  EvaluationReadinessView,
  EvaluationSummary,
  EvidenceDetail,
  EvidenceDiffView,
  EvidenceGraphView,
  EvidenceRecordView,
  EvidenceBundleSummary,
  OverviewSnapshot,
  ReportRecord,
  ReportContentView,
  ReportDownloadView,
  ResourceDetail,
  ResourceKind,
  RunDashboard,
  RunSummary,
  Scenario,
  SystemWorkspace,
  TelemetryProvenanceView,
  UiDataState,
} from "../types";

export interface OverviewInput {
  scenario: Scenario;
  dataState: UiDataState;
  candidateId?: string;
  baselineId?: string;
  datasetVersion?: string;
  profileVersionId?: string;
  runId?: string;
  track?: string;
  risk?: string;
  period?: string;
}

export interface CaseQuery {
  track?: string;
  risk?: string;
  gate?: string;
  change?: string;
  search?: string;
}

export interface EvaluationQuery {
  track?: string;
  risk?: string;
  readiness?: string;
  verdict?: string;
  search?: string;
}

export interface EvidenceQuery {
  status?: string;
  family?: string;
  search?: string;
}

export interface ConsoleApi {
  getContextOptions(options?: TransportRequestOptions): Promise<ApiResource<ContextOptionsView>>;
  getOverview(input: OverviewInput, options?: TransportRequestOptions): Promise<ApiResource<OverviewSnapshot>>;
  listRuns(options?: TransportRequestOptions): Promise<ApiResource<RunSummary[]>>;
  getRun(runId: string, options?: TransportRequestOptions): Promise<ApiResource<RunDashboard>>;
  getUgvDiagnosticDevelopmentPreset(options?: TransportRequestOptions): Promise<ApiResource<DevelopmentRunPreset>>;
  preflightBenchmarkRun(input: CreateBenchmarkRun, options?: TransportRequestOptions): Promise<ApiResource<DevelopmentRunPreflight>>;
  createBenchmarkRun(input: CreateBenchmarkRun, options?: TransportRequestOptions): Promise<ApiResource<BenchmarkRunStatus>>;
  cancelBenchmarkRun(runId: string, reason?: string, options?: TransportRequestOptions): Promise<ApiResource<BenchmarkRunStatus>>;
  getBenchmarkRunAuthorityStatus(runId: string, options?: TransportRequestOptions): Promise<ApiResource<BenchmarkRunStatus>>;
  listBenchmarkRunRepetitions(runId: string, options?: TransportRequestOptions): Promise<ApiResource<RunRepetition[]>>;
  listBenchmarkRunEvents(runId: string, options?: TransportRequestOptions): Promise<ApiResource<RunEvent[]>>;
  getDiagnosticRunQualification(runId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticQualification>>;
  listDiagnosticExternalCapabilities(runId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticArtifact[]>>;
  getDiagnosticRepetition(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticRepetition>>;
  listDiagnosticRepetitionArtifacts(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticArtifact[]>>;
  getDiagnosticExecutionTrace(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticArtifact>>;
  getDiagnosticPhysicalVerification(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticArtifact>>;
  getDiagnosticFaultAttribution(runId: string, repetitionId: string, options?: TransportRequestOptions): Promise<ApiResource<DiagnosticArtifact>>;
  listCases(query?: CaseQuery): Promise<ApiResource<CaseResult[]>>;
  getCase(caseId: string): Promise<ApiResource<CaseDetail>>;
  getComparison(comparisonId: string): Promise<ApiResource<ComparisonDetail>>;
  listEvaluations(query?: EvaluationQuery): Promise<ApiResource<EvaluationSummary[]>>;
  getEvaluation(evaluationId: string): Promise<ApiResource<EvaluationDetail>>;
  getEvaluationHeader(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationHeaderView>>;
  getEvaluationReadiness(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationReadinessView>>;
  getEvaluationEvidenceGrades(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationEvidenceGradeView[]>>;
  getEvaluationFatals(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationFatalView[]>>;
  getEvaluationHardGates(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationHardGateView[]>>;
  getEvaluationMetrics(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationMetricView[]>>;
  getEvaluationDimensions(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationDimensionView[]>>;
  getEvaluationFindings(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationFindingView[]>>;
  getEvaluationEvidenceLinks(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationEvidenceLinksView>>;
  getTelemetryProvenance(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<TelemetryProvenanceView>>;
  listInputSnapshots(episodeId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView[]>>;
  getLatestInputSnapshot(episodeId: string, identity: { profileVersionId: string; requirementSetId: string; requirementSetVersion: number }, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView>>;
  getInputSnapshot(snapshotId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView>>;
  getInputMaterial(snapshotId: string, source: "domain" | "provider", options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputMaterialView | null>>;
  reconcileInputSnapshot(episodeId: string, profileVersionId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>>;
  listEvidenceBundles(query?: EvidenceQuery): Promise<ApiResource<EvidenceBundleSummary[]>>;
  getEvidence(bundleId: string): Promise<ApiResource<EvidenceDetail>>;
  getEvidenceRecords(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceRecordView[]>>;
  getEvidenceTimeline(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceRecordView[]>>;
  getEvidenceGraph(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceGraphView>>;
  getEvidenceDiff(bundleId: string, otherBundleId: string, mode?: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceDiffView>>;
  getEvidenceUsage(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>>;
  getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>>;
  getAnalyticsModule(key: string, input: OverviewInput, options?: TransportRequestOptions): Promise<ApiResource<AnalyticsModuleView>>;
  listReports(): Promise<ApiResource<ReportRecord[]>>;
  createReport(input: { reportType: "snapshot" | "run" | "comparison" | "evaluation"; sourceId: string; format: "json" | "markdown" | "html" }, options?: TransportRequestOptions): Promise<ApiResource<ReportRecord>>;
  getReportContent(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportContentView>>;
  getReportDownload(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportDownloadView>>;
  listAlerts(): Promise<ApiResource<AlertRecord[]>>;
  getAttention(attentionId: string, options?: TransportRequestOptions): Promise<ApiResource<AlertRecord>>;
  updateAttention(attentionId: string, state: "open" | "acknowledged" | "resolved" | "ignored", options?: TransportRequestOptions): Promise<ApiResource<AlertRecord>>;
  getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>>;
  getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>>;
}

function sleep(ms = 90) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function mockDevelopmentRequest(target: "simulated" | "live"): CreateBenchmarkRun {
  return {
    datasetVersionRef: "sdar-ugv-agent-diagnostic/0.1",
    candidate: {
      snapshotRef: "candidate-development-snapshot",
      specification: { baseUrl: "http://127.0.0.1:10990" },
    },
    environment: {
      adapter: "external_integration",
      ref: "referee:http://192.168.2.63:7879/",
      config: {
        refereeBaseUrl: "http://192.168.2.63:7879",
        providerBaseUrl: "http://127.0.0.1:19100",
        telemetryBaseUrl: "http://127.0.0.1:18081",
      },
    },
    executionPolicy: {
      runClass: "development",
      target,
      executionProfile: "ugv-diagnostic-development/0.1",
      allowDevelopmentSubstitutions: true,
      fallbackToSimulation: true,
      permit: {
        schemaVersion: "sdar-benchmark.development-execution-permit/v1",
        enabled: true,
        environmentRef: "referee:http://192.168.2.63:7879/",
        target,
        maxConcurrentRuns: 1,
        maxNavigateCommandsPerRun: 3,
        allowedFaultProfiles: [
          "stale-state/v1",
          "response-loss-after-durable-dispatch/v1",
          "control-success-physical-no-effect/v1",
        ],
        expiresAt: null,
      },
    },
    contractReleaseRef: "development-contract-release",
  };
}

function mockDevelopmentPreset(): DevelopmentRunPreset {
  return {
    schemaVersion: "sdar-benchmark.development-run-preset/v1",
    presetId: "ugv-four-case-development/0.1",
    label: "UGV 四项开发诊断",
    availability: "available",
    reasonCodes: [],
    requestTemplate: mockDevelopmentRequest("live"),
    generatedAt: "2026-09-02T15:00:00.000Z",
  };
}

function mockSubstitution(
  capabilityId: string,
  implementationKind: DevelopmentSubstitution["implementationKind"],
  implementationId: string,
): DevelopmentSubstitution {
  return {
    schemaVersion: "sdar-benchmark.development-substitution/v1",
    substitutionId: `mock-substitution-${capabilityId}`,
    capabilityId,
    implementationKind,
    implementationId,
    reasonCode: "DEV_EXTERNAL_CAPABILITY_SUBSTITUTED",
    sourceCapabilityStatus: "unavailable",
    artifactRef: null,
    activatedAt: "2026-09-02T15:00:00.000Z",
    formalEligible: false,
  };
}

function mockRunAuthority(input: CreateBenchmarkRun, status: string): BenchmarkRunStatus {
  return {
    runId: "run-development-mock",
    status,
    cancellationRequested: false,
    datasetVersionRef: input.datasetVersionRef,
    candidateSnapshotId: input.candidate.snapshotRef,
    contractReleaseId: input.contractReleaseRef ?? "development-contract-release",
    totalCaseCount: 4,
    completedCaseCount: status === "completed_with_substitutions" ? 4 : 0,
    passedCaseCount: status === "completed_with_substitutions" ? 4 : 0,
    failedCaseCount: 0,
    notReadyCaseCount: 0,
    failureClass: null,
    failureCode: null,
    createdAt: "2026-09-02T15:00:00.000Z",
    startedAt: status === "queued" ? null : "2026-09-02T15:00:01.000Z",
    completedAt: status === "completed_with_substitutions" ? "2026-09-02T15:00:04.000Z" : null,
    updatedAt: "2026-09-02T15:00:02.000Z",
    created: true,
  };
}

function mockDiagnosticArtifact(
  runId: string,
  repetitionId: string | null,
  artifactKind: string,
): DiagnosticArtifact {
  const hash = `sha256:${"a".repeat(64)}`;
  return {
    relationId: `relation-${artifactKind}`,
    runId,
    repetitionId,
    subjectKind: repetitionId === null ? "run" : "repetition",
    artifactKind,
    artifactIdentity: `artifact-${artifactKind}`,
    artifactRevision: 1,
    artifactSchemaVersion: `sdar-benchmark.${artifactKind}/v1`,
    artifactRef: {
      artifactId: `artifact-${artifactKind}`,
      uri: `artifact://development/${artifactKind}`,
      sha256: hash,
      sizeBytes: 256,
      mediaType: "application/json",
    },
    summary: {
      formalEligible: false,
      stage: artifactKind,
      agent: "terminal",
      provider: "reconciled",
      physical: artifactKind === "physical-verification" ? "verified" : "observed",
    },
    relationHash: hash,
    createdAt: "2026-09-02T15:00:04.000Z",
  };
}

function mockDiagnosticRepetition(runId: string, repetitionId: string): DiagnosticRepetition {
  return {
    runId,
    repetitionId,
    caseExecutionId: `case-execution-${repetitionId}`,
    benchmarkCaseVersionId: "UGV-CORE-001@0.1",
    repeatIndex: 0,
    state: "completed",
    candidateTaskId: `task-${repetitionId}`,
    contextId: `context-${repetitionId}`,
    episodeId: `episode-${repetitionId}`,
    environmentSnapshotId: `environment-${repetitionId}`,
    terminalState: "completed",
    authorityRevision: 4,
    failureClass: null,
    failureCode: null,
    createdAt: "2026-09-02T15:00:00.000Z",
    submittedAt: "2026-09-02T15:00:01.000Z",
    terminalAt: "2026-09-02T15:00:03.000Z",
    completedAt: "2026-09-02T15:00:04.000Z",
    updatedAt: "2026-09-02T15:00:04.000Z",
  };
}

export class MockConsoleApi {
  async getOverview(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    await sleep();
    if (input.dataState === "error") {
      throw new Error("Overview Snapshot 请求失败（演示状态）");
    }
    const data = buildOverview(input.scenario, input.dataState);
    return {
      data,
      meta: capabilityMeta("overview", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listRuns(): Promise<ApiResource<RunSummary[]>> {
    await sleep();
    return {
      data: clone(runSummaries),
      meta: capabilityMeta("runs", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    await sleep();
    const data = buildRunDashboard(runId);
    return {
      data,
      meta: capabilityMeta("runDashboard", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async getUgvDiagnosticDevelopmentPreset(): Promise<ApiResource<DevelopmentRunPreset>> {
    await sleep(30);
    return {
      data: mockDevelopmentPreset(),
      meta: capabilityMeta("runPreset", { mocked: true }),
    };
  }

  async preflightBenchmarkRun(input: CreateBenchmarkRun): Promise<ApiResource<DevelopmentRunPreflight>> {
    await sleep(40);
    const policy = input.executionPolicy as Record<string, unknown>;
    const target = policy.target === "live" ? "live" : "simulated";
    return {
      data: {
        schemaVersion: "sdar-benchmark.development-run-preflight/v1",
        preflightId: `mock-preflight-${target}`,
        status: "ready_with_substitutions",
        canCreateRun: true,
        canExecuteRun: true,
        formalEligible: false,
        checks: [
          { checkId: "dataset", status: "pass", reasonCodes: [] },
          { checkId: "execution-profile", status: "pass", reasonCodes: [] },
          { checkId: "external-capabilities", status: "warning", reasonCodes: ["DEV_EXTERNAL_CAPABILITY_SUBSTITUTED"] },
        ],
        substitutions: [mockSubstitution("xchain-contradiction", "proxy", "control-success-physical-no-effect/v1")],
        warnings: ["EXACT_COMMIT_CHECK_SKIPPED_FOR_DEVELOPMENT"],
        generatedAt: "2026-09-02T15:00:00.000Z",
      },
      meta: capabilityMeta("runPreflight", { mocked: true }),
    };
  }

  async createBenchmarkRun(input: CreateBenchmarkRun): Promise<ApiResource<BenchmarkRunStatus>> {
    await sleep(45);
    return {
      data: mockRunAuthority(input, "queued"),
      meta: capabilityMeta("runCreate", { mocked: true }),
    };
  }

  async cancelBenchmarkRun(runId: string): Promise<ApiResource<BenchmarkRunStatus>> {
    await sleep(35);
    const input = mockDevelopmentRequest("simulated");
    return {
      data: { ...mockRunAuthority(input, "cancelling"), runId, cancellationRequested: true },
      meta: capabilityMeta("runCancel", { mocked: true }),
    };
  }

  async getBenchmarkRunAuthorityStatus(runId: string): Promise<ApiResource<BenchmarkRunStatus>> {
    await sleep(30);
    return {
      data: { ...mockRunAuthority(mockDevelopmentRequest("simulated"), "running"), runId },
      meta: capabilityMeta("runAuthority", { mocked: true }),
    };
  }

  async listBenchmarkRunRepetitions(runId: string): Promise<ApiResource<RunRepetition[]>> {
    const dashboard = await this.getRun(runId);
    return {
      data: dashboard.data.repetitions as RunRepetition[],
      meta: capabilityMeta("runRepetitions", { mocked: true }),
    };
  }

  async listBenchmarkRunEvents(runId: string): Promise<ApiResource<RunEvent[]>> {
    const dashboard = await this.getRun(runId);
    return {
      data: dashboard.data.events as RunEvent[],
      meta: capabilityMeta("runEvents", { mocked: true }),
    };
  }

  async getDiagnosticRunQualification(runId: string): Promise<ApiResource<DiagnosticQualification>> {
    await sleep(30);
    return {
      data: {
        runId,
        formalizationStatus: "diagnostic",
        overallScore: null,
        releaseGate: "unavailable",
        artifact: mockDiagnosticArtifact(runId, null, "diagnostic-qualification"),
        qualification: { formalEligible: false, qualificationStatus: "not_requested" },
      },
      meta: capabilityMeta("diagnosticQualification", { mocked: true }),
    };
  }

  async listDiagnosticExternalCapabilities(runId: string): Promise<ApiResource<DiagnosticArtifact[]>> {
    await sleep(30);
    return {
      data: [mockDiagnosticArtifact(runId, null, "diagnostic-external-capabilities")],
      meta: capabilityMeta("diagnosticCapabilities", { mocked: true }),
    };
  }

  async getDiagnosticRepetition(runId: string, repetitionId: string): Promise<ApiResource<DiagnosticRepetition>> {
    await sleep(30);
    return {
      data: mockDiagnosticRepetition(runId, repetitionId),
      meta: capabilityMeta("diagnosticRepetition", { mocked: true }),
    };
  }

  async listDiagnosticRepetitionArtifacts(runId: string, repetitionId: string): Promise<ApiResource<DiagnosticArtifact[]>> {
    await sleep(30);
    return {
      data: [
        mockDiagnosticArtifact(runId, repetitionId, "execution-trace"),
        mockDiagnosticArtifact(runId, repetitionId, "physical-verification"),
        mockDiagnosticArtifact(runId, repetitionId, "fault-attribution"),
      ],
      meta: capabilityMeta("diagnosticArtifacts", { mocked: true }),
    };
  }

  async getDiagnosticExecutionTrace(runId: string, repetitionId: string): Promise<ApiResource<DiagnosticArtifact>> {
    await sleep(25);
    return { data: mockDiagnosticArtifact(runId, repetitionId, "execution-trace"), meta: capabilityMeta("diagnosticExecutionTrace", { mocked: true }) };
  }

  async getDiagnosticPhysicalVerification(runId: string, repetitionId: string): Promise<ApiResource<DiagnosticArtifact>> {
    await sleep(25);
    return { data: mockDiagnosticArtifact(runId, repetitionId, "physical-verification"), meta: capabilityMeta("diagnosticPhysicalVerification", { mocked: true }) };
  }

  async getDiagnosticFaultAttribution(runId: string, repetitionId: string): Promise<ApiResource<DiagnosticArtifact>> {
    await sleep(25);
    return { data: mockDiagnosticArtifact(runId, repetitionId, "fault-attribution"), meta: capabilityMeta("diagnosticFaultAttribution", { mocked: true }) };
  }

  async listCases(query: CaseQuery = {}): Promise<ApiResource<CaseResult[]>> {
    await sleep(40);
    const search = query.search?.toLowerCase();
    const data = caseResults.filter((item) => {
      if (query.track && query.track !== "all" && item.track !== query.track.toLowerCase()) return false;
      if (query.risk && query.risk !== "all" && item.risk !== query.risk.toLowerCase()) return false;
      if (query.gate && !item.gates.includes(query.gate)) return false;
      if (query.change && !item.change.toLowerCase().includes(query.change.toLowerCase())) return false;
      if (search && !`${item.caseId} ${item.title}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("caseResults", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getCase(caseId: string): Promise<ApiResource<CaseDetail>> {
    await sleep(55);
    return {
      data: buildCaseDetail(caseId),
      meta: capabilityMeta("caseDetail", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getComparison(_comparisonId: string): Promise<ApiResource<ComparisonDetail>> {
    await sleep();
    return {
      data: clone(comparisonDetail),
      meta: capabilityMeta("comparison", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async listEvaluations(query: EvaluationQuery = {}): Promise<ApiResource<EvaluationSummary[]>> {
    await sleep(55);
    const search = query.search?.toLowerCase();
    const data = evaluationSummaries.filter((item) => {
      if (query.track && query.track !== "all" && item.track !== query.track) return false;
      if (query.risk && query.risk !== "all" && item.risk !== query.risk) return false;
      if (query.readiness && query.readiness !== "all" && item.readiness !== query.readiness) return false;
      if (query.verdict && query.verdict !== "all" && item.verdict !== query.verdict) return false;
      if (search && !`${item.evaluationId} ${item.caseId}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("evaluations", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getEvaluation(_evaluationId: string): Promise<ApiResource<EvaluationDetail>> {
    await sleep();
    const data = buildEvaluationDetail(_evaluationId);
    return {
      data,
      meta: capabilityMeta("evaluation", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getEvaluationHeader(evaluationId: string): Promise<ApiResource<EvaluationHeaderView>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: {
        evaluationId: detail.evaluationId,
        caseId: detail.caseId,
        episodeId: detail.episodeId,
        origin: detail.origin,
        profileVersionId: detail.profile,
        bundleSnapshotId: detail.bundleId,
        readiness: detail.readiness.evaluation,
        scoreStatus: detail.scoreStatus,
        qualityScore: detail.qualityScore,
        level: detail.level,
        passed: detail.passed,
        createdAt: "2026-08-15T20:31:42Z",
      },
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationReadiness(evaluationId: string): Promise<ApiResource<EvaluationReadinessView>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: {
        sourceEvidenceReadiness: detail.readiness.source,
        evaluationReadiness: detail.readiness.evaluation,
        missingFamilies: detail.readiness.missing,
        conflictingFamilies: detail.readiness.conflicts,
        reasonCodes: detail.readiness.missing.length > 0 ? ["EVIDENCE_FAMILY_MISSING"] : [],
      },
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationEvidenceGrades(evaluationId: string): Promise<ApiResource<EvaluationEvidenceGradeView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    const families = ["canonical", "domain", "provider"];
    return {
      data: families.map((family) => ({
        family,
        grade: detail.readiness.missing.includes(family) ? null : "complete",
        reasonCodes: detail.readiness.missing.includes(family) ? ["EVIDENCE_FAMILY_MISSING"] : [],
        evidenceRefs: detail.readiness.missing.includes(family) ? [] : [`artifact://${detail.bundleId}/${family}`],
      })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationFatals(evaluationId: string): Promise<ApiResource<EvaluationFatalView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: detail.fatals.map((item) => ({ ...item, evidenceRefs: [], reasonCodes: [] })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationHardGates(evaluationId: string): Promise<ApiResource<EvaluationHardGateView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: detail.gates.map((item) => ({ id: item.id, result: item.result, reason: item.reason ?? null, evidenceRefs: item.evidenceRefs ?? [], reasonCodes: [] })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationMetrics(evaluationId: string): Promise<ApiResource<EvaluationMetricView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: detail.metrics.map((item) => ({ ...item, reasonCodes: [] })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationDimensions(evaluationId: string): Promise<ApiResource<EvaluationDimensionView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: detail.dimensions.map((item) => ({ ...item, threshold: null, passed: null, applicable: true, metricIds: [] })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationFindings(evaluationId: string): Promise<ApiResource<EvaluationFindingView[]>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: detail.findings.map((item, index) => ({ id: `${evaluationId}-finding-${index + 1}`, type: item.title, severity: item.severity, summary: item.summary, evidenceRefs: item.evidenceRefs, priority: null })),
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvaluationEvidenceLinks(evaluationId: string): Promise<ApiResource<EvaluationEvidenceLinksView>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: {
        evaluationId,
        bundleSnapshotId: detail.bundleId,
        bundleArtifactRef: `artifact://${detail.bundleId}`,
        bundleContentHash: `sha256:${"a".repeat(64)}`,
        inputSnapshotId: `input-${evaluationId}`,
        inputSnapshotContentHash: `sha256:${"b".repeat(64)}`,
        inputSnapshotArtifactUri: `artifact://input-${evaluationId}`,
        formalInputEligible: detail.scoreStatus === "formal",
        compositeReadiness: detail.readiness.evaluation,
        inputSourceWatermark: "2026-08-15T20:31:42Z",
        inputSourceRefs: [],
        evidenceRefs: [`artifact://${detail.bundleId}`],
      },
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getTelemetryProvenance(evaluationId: string): Promise<ApiResource<TelemetryProvenanceView>> {
    const detail = (await this.getEvaluation(evaluationId)).data;
    return {
      data: {
        evaluationId,
        origin: detail.origin,
        inputSnapshotId: `input-${evaluationId}`,
        inputSnapshotContentHash: `sha256:${"b".repeat(64)}`,
        overallReadiness: detail.readiness.evaluation,
        formalInputEligible: detail.scoreStatus === "formal",
        effectiveWatermark: "2026-08-15T20:31:42Z",
        sources: [],
      },
      meta: capabilityMeta("evaluation", { mocked: true }),
    };
  }

  async getEvidence(_bundleId: string): Promise<ApiResource<EvidenceDetail>> {
    await sleep();
    const data = buildEvidenceDetail(_bundleId);
    return {
      data,
      meta: capabilityMeta("evidenceBundle", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async listEvidenceBundles(query: EvidenceQuery = {}): Promise<ApiResource<EvidenceBundleSummary[]>> {
    await sleep(55);
    const search = query.search?.toLowerCase();
    const data = evidenceBundleSummaries.filter((item) => {
      if (query.status && query.status !== "all" && item.status !== query.status) return false;
      if (query.family === "missing" && item.missingFamilies.length === 0) return false;
      if (query.family === "complete" && item.missingFamilies.length > 0) return false;
      if (search && !`${item.bundleId} ${item.caseId} ${item.episodeId}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("evidenceBundles", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    await sleep(70);
    const data = buildOverview(input.scenario, input.dataState);
    return {
      data,
      meta: capabilityMeta("analytics", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listReports(): Promise<ApiResource<ReportRecord[]>> {
    await sleep(45);
    return { data: clone(reportRecords), meta: capabilityMeta("reports", { mocked: true }) };
  }

  async listAlerts(): Promise<ApiResource<AlertRecord[]>> {
    await sleep(45);
    return { data: clone(alertRecords), meta: capabilityMeta("alerts", { mocked: true }) };
  }

  async getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>> {
    await sleep(45);
    return {
      data: clone(systemWorkspace),
      meta: capabilityMeta("systemWorkspace", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>> {
    await sleep(45);
    const key = kind === "candidate" ? "candidateDetail" : kind === "baseline" ? "baselineDetail" : kind === "dataset" ? "datasetDetail" : "profileDetail";
    return { data: getResourceDetail(kind, id), meta: capabilityMeta(key, { mocked: true }) };
  }
}

function readViteEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.[name];
}

export function currentApiMode(): "mock" | "msw" | "http" | "hybrid" {
  const value = readViteEnv("VITE_API_MODE");
  return value === "msw" || value === "http" || value === "hybrid" ? value : "mock";
}

class PrototypeHttpConsoleApi {
  constructor(private readonly baseUrl = readViteEnv("VITE_BENCHMARK_API_BASE_URL") ?? "http://127.0.0.1:18090") {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as T;
  }

  async getOverview(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    const query = new URLSearchParams({
      candidateId: input.candidateId ?? "cand-142-def456",
      datasetVersion: input.datasetVersion ?? "release-v0.1",
      profileVersionId: input.profileVersionId ?? "sdar-v2-review-2.1",
      track: input.track ?? "all",
      riskLevel: input.risk ?? "all",
      period: input.period ?? "7d",
    });
    if (input.baselineId) query.set("baselineId", input.baselineId);
    if (input.runId) query.set("runId", input.runId);
    const data = await this.request<OverviewSnapshot>(`/v1/dashboard/overview?${query}`);
    return {
      data,
      meta: capabilityMeta("overview", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listRuns(): Promise<ApiResource<RunSummary[]>> {
    const envelope = await this.request<{ data: RunSummary[]; watermark?: string; projectionLagMs?: number }>(
      "/v1/benchmark-runs",
    );
    return {
      data: envelope.data,
      meta: capabilityMeta("runs", {
        mocked: false,
        watermark: envelope.watermark,
        projectionLagMs: envelope.projectionLagMs,
      }),
    };
  }

  async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    const envelope = await this.request<{ snapshot: RunDashboard["snapshot"]; data: Omit<RunDashboard, "snapshot"> }>(
      `/v1/benchmark-runs/${encodeURIComponent(runId)}/dashboard`,
    );
    const data = { ...envelope.data, snapshot: envelope.snapshot } as RunDashboard;
    return {
      data,
      meta: capabilityMeta("runDashboard", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listCases(query: CaseQuery = {}): Promise<ApiResource<CaseResult[]>> {
    const search = new URLSearchParams();
    if (query.track) search.set("track", query.track);
    if (query.risk) search.set("riskLevel", query.risk);
    if (query.gate) search.set("gateId", query.gate);
    if (query.change) search.set("changeType", query.change);
    if (query.search) search.set("search", query.search);
    const envelope = await this.request<{ data: CaseResult[]; watermark?: string; projectionLagMs?: number }>(
      `/v1/case-results?${search}`,
    );
    return {
      data: envelope.data,
      meta: capabilityMeta("caseResults", {
        mocked: false,
        watermark: envelope.watermark,
        projectionLagMs: envelope.projectionLagMs,
      }),
    };
  }

  async getCase(caseId: string): Promise<ApiResource<CaseDetail>> {
    const data = await this.request<CaseDetail>(`/v1/benchmark-cases/${encodeURIComponent(caseId)}`);
    return { data, meta: capabilityMeta("caseDetail", { mocked: false }) };
  }

  async getComparison(comparisonId: string): Promise<ApiResource<ComparisonDetail>> {
    const data = await this.request<ComparisonDetail>(`/v1/comparisons/${encodeURIComponent(comparisonId)}/dashboard`);
    return { data, meta: capabilityMeta("comparison", { mocked: false }) };
  }

  async listEvaluations(query: EvaluationQuery = {}): Promise<ApiResource<EvaluationSummary[]>> {
    const search = new URLSearchParams();
    if (query.track) search.set("track", query.track);
    if (query.risk) search.set("riskLevel", query.risk);
    if (query.readiness) search.set("readiness", query.readiness);
    if (query.verdict) search.set("verdict", query.verdict);
    if (query.search) search.set("search", query.search);
    const envelope = await this.request<{ data: EvaluationSummary[]; watermark?: string; projectionLagMs?: number }>(`/v1/evaluations?${search}`);
    return { data: envelope.data, meta: capabilityMeta("evaluations", { mocked: false, watermark: envelope.watermark, projectionLagMs: envelope.projectionLagMs }) };
  }

  async getEvaluation(evaluationId: string): Promise<ApiResource<EvaluationDetail>> {
    const data = await this.request<EvaluationDetail>(`/v1/evaluations/${encodeURIComponent(evaluationId)}`);
    return { data, meta: capabilityMeta("evaluation", { mocked: false }) };
  }

  async getEvidence(bundleId: string): Promise<ApiResource<EvidenceDetail>> {
    const data = await this.request<EvidenceDetail>(`/v1/evidence-bundles/${encodeURIComponent(bundleId)}`);
    return { data, meta: capabilityMeta("evidenceBundle", { mocked: false }) };
  }

  async listEvidenceBundles(query: EvidenceQuery = {}): Promise<ApiResource<EvidenceBundleSummary[]>> {
    const search = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value && search.set(key, value));
    const envelope = await this.request<{ data: EvidenceBundleSummary[]; watermark?: string; projectionLagMs?: number }>(`/v1/evidence-bundles?${search}`);
    return { data: envelope.data, meta: capabilityMeta("evidenceBundles", { mocked: false, watermark: envelope.watermark, projectionLagMs: envelope.projectionLagMs }) };
  }

  async getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    const query = new URLSearchParams({
      track: input.track ?? "all",
      riskLevel: input.risk ?? "all",
      period: input.period ?? "7d",
    });
    if (input.candidateId) query.set("candidateId", input.candidateId);
    if (input.baselineId) query.set("baselineId", input.baselineId);
    if (input.datasetVersion) query.set("datasetVersion", input.datasetVersion);
    if (input.profileVersionId) query.set("profileVersionId", input.profileVersionId);
    if (input.runId) query.set("runId", input.runId);
    const data = await this.request<OverviewSnapshot>(`/v1/dashboard/overview?${query}`);
    return {
      data,
      meta: capabilityMeta("analytics", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listReports(): Promise<ApiResource<ReportRecord[]>> {
    const envelope = await this.request<{ data: ReportRecord[] }>("/v1/reports");
    return { data: envelope.data, meta: capabilityMeta("reports", { mocked: false }) };
  }

  async listAlerts(): Promise<ApiResource<AlertRecord[]>> {
    const envelope = await this.request<{ data: AlertRecord[] }>("/v1/attention-items");
    return { data: envelope.data, meta: capabilityMeta("alerts", { mocked: false }) };
  }

  async getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>> {
    const data = await this.request<SystemWorkspace>("/v1/system/status");
    return { data, meta: capabilityMeta("systemWorkspace", { mocked: false }) };
  }

  async getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>> {
    const plural = kind === "candidate" ? "candidates" : kind === "baseline" ? "baselines" : kind === "dataset" ? "datasets" : "evaluation-profiles";
    const key = kind === "candidate" ? "candidateDetail" : kind === "baseline" ? "baselineDetail" : kind === "dataset" ? "datasetDetail" : "profileDetail";
    const data = await this.request<ResourceDetail>(`/v1/${plural}/${encodeURIComponent(id)}`);
    return { data, meta: capabilityMeta(key, { mocked: false }) };
  }
}

export class HybridConsoleApi extends MockConsoleApi {
  private readonly http = new LiveHttpConsoleApi();

  override async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    try {
      return await this.http.getRun(runId);
    } catch {
      return super.getRun(runId);
    }
  }
}

export function hybridSourceAware(api: HybridConsoleApi): ConsoleApi {
  return new Proxy(api, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        const resource = await value.apply(target, args) as ApiResource<unknown>;
        if (resource?.meta) {
          resource.meta.mode = "hybrid";
          resource.meta.warnings = [...resource.meta.warnings, resource.meta.mocked ? "HYBRID source: deterministic Mock adapter." : "HYBRID source: live Benchmark HTTP API."];
        }
        return resource;
      };
    },
  }) as unknown as ConsoleApi;
}

export function createConsoleApi(): ConsoleApi {
  const mode = currentApiMode();
  if (mode === "http" || mode === "msw") return new LiveHttpConsoleApi(mode === "msw" ? "" : undefined);
  if (mode === "hybrid") return hybridSourceAware(new HybridConsoleApi());
  return new MockConsoleApi() as unknown as ConsoleApi;
}

export const consoleApi = createConsoleApi();
export { LiveHttpConsoleApi as HttpConsoleApi };
