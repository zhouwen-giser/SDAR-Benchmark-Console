import type {
  AttentionItemListEnvelope,
  AttentionItemEnvelope,
  AttentionStateEnvelope,
  BenchmarkRunStatus,
  BenchmarkCaseEnvelope,
  BenchmarkCaseListEnvelope,
  BenchmarkRunListEnvelope,
  BenchmarkReleaseGateQueryEnvelope,
  CaseExecutionListEnvelope,
  CaseResultExplorerEnvelope,
  ComparisonCaseProjectionListQueryEnvelope,
  ComparisonDashboardEnvelope,
  ComparisonEvidenceDiffListEnvelope,
  ContextOptionsEnvelope,
  CreateBenchmarkRun,
  DashboardOverviewResponse,
  DevelopmentRunPreflight,
  DevelopmentRunPreset,
  DiagnosticArtifactEnvelope,
  DiagnosticArtifactListEnvelope,
  DiagnosticQualificationEnvelope,
  DiagnosticRepetitionEnvelope,
  EvaluationBindingEnvelope,
  EvaluationDimensionListEnvelope,
  EvaluationEvidenceGradeListEnvelope,
  EvaluationEvidenceLinksEnvelope,
  EvaluationFatalListEnvelope,
  EvaluationFindingListEnvelope,
  EvaluationHardGateListEnvelope,
  EvaluationInputMaterialEnvelope,
  EvaluationInputReconcileEnvelope,
  EvaluationInputSnapshotEnvelope,
  EvaluationInputSnapshotListEnvelope,
  EvaluationMetricListEnvelope,
  EvaluationReadinessEnvelope,
  EvaluationSummaryListEnvelope,
  EvaluationSummaryQueryEnvelope,
  EvidenceBundleEnvelope,
  EvidenceBundleListEnvelope,
  EvidenceDiffEnvelope,
  EvidenceGraphEnvelope,
  EvidenceFunnelEnvelope,
  EvidenceRecordListEnvelope,
  EvidenceUsageEnvelope,
  ExpectedContractEnvelope,
  ReportContentEnvelope,
  ReportDownloadEnvelope,
  ReportEnvelope,
  ReportListEnvelope,
  Ready,
  RunDashboardEnvelope,
  RunEventListEnvelope,
  RunRepetitionListEnvelope,
  SystemContractsEnvelope,
  SystemProjectionsEnvelope,
  SystemStatusEnvelope,
  TelemetryProvenanceEnvelope,
} from "./generated/model";
import type {
  AlertRecord,
  ApiResource,
  CaseDetail,
  ComparisonDetail,
  DataCompletenessView,
  EvaluationDetail,
  EvaluationEvidenceLinksView,
  EvidenceDetail,
  OverviewSnapshot,
  ReportContentView,
  ReportDownloadView,
  ReportRecord,
  ResourceDetail,
  ResourceKind,
  RunDashboard,
  SystemWorkspace,
} from "../types";
import type { ConsoleApi, EvidenceQuery, EvaluationQuery, OverviewInput, CaseQuery } from "./consoleApi";
import { BenchmarkApiHttpError, BenchmarkApiTransport, type TransportRequestOptions } from "./benchmarkApiTransport";
import { capabilityMeta, type CapabilityKey } from "./capability-map";
import {
  mapAnalyticsModule,
  mapAttention,
  mapBenchmarkCase,
  mapCaseResult,
  mapComparison,
  mapContextOptions,
  mapDimension,
  mapEnvelope,
  mapEvaluationHeader,
  mapEvaluationReadiness,
  mapEvaluationSummary,
  mapEvidenceBundleSummary,
  mapEvidenceDetail,
  mapEvidenceDiff,
  mapEvidenceGrade,
  mapEvidenceGraph,
  mapEvidenceRecord,
  mapFatal,
  mapFinding,
  mapHardGate,
  mapInputMaterial,
  mapInputSnapshot,
  mapMetric,
  mapOverview,
  mapReport,
  mapResource,
  mapRunDashboard,
  mapRunSummary,
  mapSystemWorkspace,
  mapTelemetryProvenance,
  mergeMeta,
  metaFromEnvelope,
  type CapabilityEnvelopeLike,
} from "./viewModelMappers";

const analyticsKeys = [
  "candidates", "tracks", "scenario-families", "risks", "skills", "providers",
  "quality-trend", "change-summary", "track-risk-matrix", "metrics", "dimensions",
  "readiness-funnel", "stability", "regression-contributors", "score-distribution",
  "operational", "gates", "fatals",
] as const;

export class LiveHttpConsoleApi implements ConsoleApi {
  readonly transport: BenchmarkApiTransport;

  constructor(baseUrl?: string) {
    this.transport = new BenchmarkApiTransport(baseUrl);
  }

  async getContextOptions(options?: TransportRequestOptions) {
    const envelope = await this.transport.get<ContextOptionsEnvelope>("/v1/context/options", options);
    return mapEnvelope("contextOptions", envelope, mapContextOptions);
  }

  async getOverview(input: OverviewInput, options?: TransportRequestOptions) {
    const query = analysisQuery(input);
    const data = await this.transport.get<DashboardOverviewResponse>(`/v1/dashboard/overview?${query}`, options);
    const view = mapOverview(data);
    const reasons = view.snapshot.moduleErrors.map((item) => item.code ?? item.reason);
    return {
      data: view,
      meta: capabilityMeta("overview", {
        mocked: false,
        mode: "http",
        availability: view.snapshot.dataStatus === "complete" ? "available" : view.snapshot.dataStatus === "empty" ? "unavailable" : "partial",
        reasonCodes: reasons,
        unavailableFields: view.snapshot.moduleErrors.map((item) => item.module),
        warnings: view.snapshot.moduleErrors.map((item) => item.reason),
        watermark: view.snapshot.watermark,
        projectionLagMs: view.snapshot.projectionLagMs,
        contracts: data.contracts,
        generatedAt: data.generatedAt,
      }),
    };
  }

  async getDataCompleteness(options?: TransportRequestOptions): Promise<ApiResource<DataCompletenessView>> {
    const data = await this.transport.get<DataCompletenessView>("/v1/data-completeness", options);
    return {
      data,
      meta: capabilityMeta("dataCompleteness", {
        mocked: false,
        mode: "http",
        availability: data.overallStatus === "complete" ? "available" : data.overallStatus,
        reasonCodes: [...new Set(data.sections.flatMap((section) => section.reasonCodes))],
        unavailableFields: data.sections.filter((section) => section.status === "unavailable").map((section) => section.sectionId),
        watermark: data.sections.map((section) => section.watermark).find(Boolean) ?? null,
        generatedAt: data.generatedAt,
      }),
    };
  }

  async listRuns(options?: TransportRequestOptions) {
    const envelope = await this.transport.get<BenchmarkRunListEnvelope>("/v1/benchmark-runs", options);
    return mapEnvelope("runs", envelope, (rows) => rows.map(mapRunSummary));
  }

  async getRun(runId: string, options?: TransportRequestOptions): Promise<ApiResource<RunDashboard>> {
    const root = `/v1/benchmark-runs/${part(runId)}`;
    const [dashboard, repetitions, events, funnel, gate] = await Promise.allSettled([
      this.transport.get<RunDashboardEnvelope>(`${root}/dashboard`, options),
      this.transport.get<RunRepetitionListEnvelope>(`${root}/repetitions`, options),
      this.transport.get<RunEventListEnvelope>(`${root}/events`, options),
      this.transport.get<EvidenceFunnelEnvelope>(`${root}/evidence-funnel`, options),
      this.transport.get<BenchmarkReleaseGateQueryEnvelope>(`${root}/release-gate`, options),
    ]);
    if (dashboard.status === "rejected") throw dashboard.reason;
    const results = [repetitions, events, funnel, gate];
    const meta = aggregate("runDashboard", [dashboard.value, ...fulfilled(results)], rejected(results));
    return { data: mapRunDashboard(dashboard.value.data, meta, { repetitions: value(repetitions)?.data, events: value(events)?.data, evidenceFunnel: value(funnel)?.data, releaseGate: value(gate)?.data }), meta };
  }

  async getUgvDiagnosticDevelopmentPreset(options?: TransportRequestOptions) {
    const data = await this.transport.get<DevelopmentRunPreset>(
      "/v1/benchmark-run-presets/ugv-diagnostic-development",
      options,
    );
    return { data, meta: capabilityMeta("runPreset", { mocked: false, mode: "http", generatedAt: data.generatedAt }) };
  }

  async preflightBenchmarkRun(input: CreateBenchmarkRun, options?: TransportRequestOptions) {
    const data = await this.transport.post<DevelopmentRunPreflight>(
      "/v1/benchmark-run-preflights",
      input,
      options,
    );
    return {
      data,
      meta: capabilityMeta("runPreflight", {
        mocked: false,
        mode: "http",
        availability: data.status === "failed_preflight" ? "unavailable" : data.status === "ready_with_substitutions" ? "partial" : "available",
        reasonCodes: data.checks.flatMap((item) => item.reasonCodes),
        warnings: data.warnings,
        generatedAt: data.generatedAt,
      }),
    };
  }

  async createBenchmarkRun(input: CreateBenchmarkRun, options?: TransportRequestOptions) {
    const data = await this.transport.post<BenchmarkRunStatus>("/v1/benchmark-runs", input, options);
    return { data, meta: capabilityMeta("runCreate", { mocked: false, mode: "http" }) };
  }

  async cancelBenchmarkRun(runId: string, reason?: string, options?: TransportRequestOptions) {
    const data = await this.transport.post<BenchmarkRunStatus>(
      `/v1/benchmark-runs/${part(runId)}/cancel`,
      reason === undefined ? {} : { reason },
      options,
    );
    return { data, meta: capabilityMeta("runCancel", { mocked: false, mode: "http" }) };
  }

  async getBenchmarkRunAuthorityStatus(runId: string, options?: TransportRequestOptions) {
    const data = await this.transport.get<BenchmarkRunStatus>(`/v1/benchmark-runs/${part(runId)}`, options);
    return { data, meta: capabilityMeta("runAuthority", { mocked: false, mode: "http" }) };
  }

  async listBenchmarkRunRepetitions(runId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<RunRepetitionListEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/repetitions`,
      options,
    );
    return mapEnvelope("runRepetitions", envelope, (data) => data);
  }

  async listBenchmarkRunEvents(runId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<RunEventListEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/events`,
      options,
    );
    return mapEnvelope("runEvents", envelope, (data) => data);
  }

  async getDiagnosticRunQualification(runId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<DiagnosticQualificationEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/qualification`,
      options,
    );
    return mapEnvelope("diagnosticQualification", envelope, (data) => data);
  }

  async listDiagnosticExternalCapabilities(runId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<DiagnosticArtifactListEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/external-capabilities`,
      options,
    );
    return mapEnvelope("diagnosticCapabilities", envelope, (data) => data);
  }

  async getDiagnosticRepetition(runId: string, repetitionId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<DiagnosticRepetitionEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/repetitions/${part(repetitionId)}`,
      options,
    );
    return mapEnvelope("diagnosticRepetition", envelope, (data) => data);
  }

  async listDiagnosticRepetitionArtifacts(runId: string, repetitionId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<DiagnosticArtifactListEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/repetitions/${part(repetitionId)}/artifacts`,
      options,
    );
    return mapEnvelope("diagnosticArtifacts", envelope, (data) => data);
  }

  async getDiagnosticExecutionTrace(runId: string, repetitionId: string, options?: TransportRequestOptions) {
    return this.getDiagnosticArtifact(runId, repetitionId, "execution-trace", "diagnosticExecutionTrace", options);
  }

  async getDiagnosticPhysicalVerification(runId: string, repetitionId: string, options?: TransportRequestOptions) {
    return this.getDiagnosticArtifact(runId, repetitionId, "physical-verification", "diagnosticPhysicalVerification", options);
  }

  async getDiagnosticFaultAttribution(runId: string, repetitionId: string, options?: TransportRequestOptions) {
    return this.getDiagnosticArtifact(runId, repetitionId, "fault-attribution", "diagnosticFaultAttribution", options);
  }

  private async getDiagnosticArtifact(
    runId: string,
    repetitionId: string,
    path: "execution-trace" | "physical-verification" | "fault-attribution",
    key: "diagnosticExecutionTrace" | "diagnosticPhysicalVerification" | "diagnosticFaultAttribution",
    options?: TransportRequestOptions,
  ) {
    const envelope = await this.transport.get<DiagnosticArtifactEnvelope>(
      `/v1/benchmark-runs/${part(runId)}/repetitions/${part(repetitionId)}/${path}`,
      options,
    );
    return mapEnvelope(key, envelope, (data) => data);
  }

  async listCases(query: CaseQuery = {}) {
    const search = new URLSearchParams();
    set(search, "track", cleanAll(query.track));
    set(search, "riskLevel", cleanAll(query.risk));
    set(search, "gateId", query.gate);
    set(search, "changeType", query.change);
    set(search, "search", query.search);
    const envelope = await this.transport.get<CaseResultExplorerEnvelope>(`/v1/case-results?${search}`);
    return mapEnvelope("caseResults", envelope, (rows) => rows.map(mapCaseResult));
  }

  async getCase(caseId: string): Promise<ApiResource<CaseDetail>> {
    const root = await this.transport.get<BenchmarkCaseEnvelope>(`/v1/benchmark-cases/${part(caseId)}`);
    const paths = {
      history: `/v1/benchmark-cases/${part(caseId)}/history`,
      executions: `/v1/benchmark-cases/${part(caseId)}/executions`,
      expected: `/v1/benchmark-cases/${part(caseId)}/expected-contract`,
      binding: `/v1/benchmark-cases/${part(caseId)}/evaluation-binding`,
      stability: `/v1/benchmark-cases/${part(caseId)}/stability`,
    };
    const [history, executions, expected, binding, stability] = await Promise.allSettled([
      this.transport.get<CapabilityEnvelopeLike<unknown[]>>(paths.history),
      this.transport.get<CaseExecutionListEnvelope>(paths.executions),
      this.transport.get<ExpectedContractEnvelope>(paths.expected),
      this.transport.get<EvaluationBindingEnvelope>(paths.binding),
      this.transport.get<CapabilityEnvelopeLike<unknown>>(paths.stability),
    ]);
    const meta = aggregate("caseDetail", [root, ...fulfilled([history, executions, expected, binding, stability])], rejected([history, executions, expected, binding, stability]));
    return {
      data: mapBenchmarkCase(root.data, {
        history: value(history)?.data as unknown[] | undefined,
        executions: value(executions)?.data,
        expected: value(expected)?.data,
        binding: value(binding)?.data,
        stability: value(stability)?.data,
      }),
      meta,
    };
  }

  async getComparison(comparisonId: string): Promise<ApiResource<ComparisonDetail>> {
    const [dashboard, cases, diffs] = await Promise.all([
      this.transport.get<ComparisonDashboardEnvelope>(`/v1/comparisons/${part(comparisonId)}/dashboard`),
      this.transport.get<ComparisonCaseProjectionListQueryEnvelope>(`/v1/comparisons/${part(comparisonId)}/cases`),
      this.transport.get<ComparisonEvidenceDiffListEnvelope>(`/v1/comparisons/${part(comparisonId)}/evidence-diffs`),
    ]);
    const meta = mergeMeta("comparison", [metaFromEnvelope("comparison", dashboard), metaFromEnvelope("comparisonCases", cases), metaFromEnvelope("comparisonEvidenceDiffs", diffs)]);
    const data = mapComparison(dashboard.data, cases.data);
    data.cases = data.cases.map((row) => {
      const diff = diffs.data.find((item) => item.caseId === row.caseId);
      return diff ? { ...row, baselineBundleId: diff.baselineBundleSnapshotId ?? row.baselineBundleId, candidateBundleId: diff.candidateBundleSnapshotId ?? row.candidateBundleId, evaluationId: diff.candidateEvaluationId ?? row.evaluationId } : row;
    });
    return { data, meta };
  }

  async listEvaluations(query: EvaluationQuery = {}) {
    const envelope = await this.transport.get<EvaluationSummaryListEnvelope>("/v1/evaluations");
    const rows = envelope.data.map(mapEvaluationSummary).filter((item) => {
      if (query.readiness && query.readiness !== "all" && item.readiness !== query.readiness) return false;
      if (query.verdict && query.verdict !== "all" && item.verdict !== query.verdict) return false;
      if (query.search && !`${item.evaluationId} ${item.caseId}`.toLowerCase().includes(query.search.toLowerCase())) return false;
      return true;
    });
    return { data: rows, meta: metaFromEnvelope("evaluations", envelope) };
  }

  async getEvaluation(evaluationId: string): Promise<ApiResource<EvaluationDetail>> {
    const [header, readiness, fatals, gates, metrics, dimensions, findings] = await Promise.all([
      this.getEvaluationHeader(evaluationId), this.getEvaluationReadiness(evaluationId), this.getEvaluationFatals(evaluationId),
      this.getEvaluationHardGates(evaluationId), this.getEvaluationMetrics(evaluationId), this.getEvaluationDimensions(evaluationId), this.getEvaluationFindings(evaluationId),
    ]);
    return {
      data: {
        evaluationId: header.data.evaluationId, caseId: header.data.caseId, episodeId: header.data.episodeId ?? "unavailable", origin: header.data.origin,
        profile: header.data.profileVersionId, bundleId: header.data.bundleSnapshotId,
        readiness: { source: readiness.data.sourceEvidenceReadiness ?? "unavailable", evaluation: readiness.data.evaluationReadiness, missing: readiness.data.missingFamilies, conflicts: readiness.data.conflictingFamilies },
        scoreStatus: header.data.scoreStatus, qualityScore: header.data.qualityScore, level: header.data.level, passed: header.data.passed === true,
        fatals: fatals.data.map((item) => ({ id: item.id, matched: item.matched === true, proofStatus: item.proofStatus, evidenceLevel: item.evidenceLevel ?? "unavailable" })),
        gates: gates.data.map((item) => ({ id: item.id, result: item.result, reason: item.reason ?? undefined, evidenceRefs: item.evidenceRefs })),
        metrics: metrics.data.map((item) => ({ id: item.id, raw: item.raw, weight: item.weight ?? 0, evidenceLevel: item.evidenceLevel ?? "unavailable", status: item.status, summary: item.summary ?? item.reasonCodes.join(", ") })),
        dimensions: dimensions.data.filter((item) => item.score != null).map((item) => ({ id: item.id, label: item.label, score: item.score! })),
        findings: findings.data.map((item) => ({ severity: item.severity ?? "info", title: item.id, summary: item.summary, evidenceRefs: item.evidenceRefs, recommendedAction: item.priority ?? "—" })),
      },
      meta: mergeMeta("evaluation", [header.meta, readiness.meta, fatals.meta, gates.meta, metrics.meta, dimensions.meta, findings.meta]),
    };
  }

  async getEvaluationHeader(evaluationId: string, options?: TransportRequestOptions) {
    const envelope = await this.transport.get<EvaluationSummaryQueryEnvelope>(`/v1/evaluations/${part(evaluationId)}`, options);
    return mapEnvelope("evaluation", envelope, mapEvaluationHeader);
  }
  async getEvaluationReadiness(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationReadinessEnvelope>(evalPath(evaluationId, "readiness"), options); return mapEnvelope("evaluationReadiness", e, mapEvaluationReadiness); }
  async getEvaluationEvidenceGrades(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationEvidenceGradeListEnvelope>(evalPath(evaluationId, "evidence-grades"), options); return mapEnvelope("evaluation", e, (rows) => rows.map(mapEvidenceGrade)); }
  async getEvaluationFatals(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationFatalListEnvelope>(evalPath(evaluationId, "fatals"), options); return mapEnvelope("evaluation", e, (rows) => rows.map(mapFatal)); }
  async getEvaluationHardGates(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationHardGateListEnvelope>(evalPath(evaluationId, "hard-gates"), options); return mapEnvelope("evaluation", e, (rows) => rows.map(mapHardGate)); }
  async getEvaluationMetrics(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationMetricListEnvelope>(evalPath(evaluationId, "metrics"), options); return mapEnvelope("evaluationMetrics", e, (rows) => rows.map(mapMetric)); }
  async getEvaluationDimensions(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationDimensionListEnvelope>(evalPath(evaluationId, "dimensions"), options); return mapEnvelope("evaluation", e, (rows) => rows.map(mapDimension)); }
  async getEvaluationFindings(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationFindingListEnvelope>(evalPath(evaluationId, "findings"), options); return mapEnvelope("evaluation", e, (rows) => rows.map(mapFinding)); }
  async getEvaluationEvidenceLinks(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationEvidenceLinksView>> { const e = await this.transport.get<EvaluationEvidenceLinksEnvelope>(evalPath(evaluationId, "evidence-links"), options); return mapEnvelope("evaluation", e, (data) => data as unknown as EvaluationEvidenceLinksView); }
  async getTelemetryProvenance(evaluationId: string, options?: TransportRequestOptions) { const e = await this.transport.get<TelemetryProvenanceEnvelope>(evalPath(evaluationId, "telemetry-provenance"), options); return mapEnvelope("evaluationProvenance", e, mapTelemetryProvenance); }

  async listInputSnapshots(episodeId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationInputSnapshotListEnvelope>(`/v1/episodes/${part(episodeId)}/evaluation-input-snapshots`, options); return mapEnvelope("evaluationInput", e, (rows) => rows.map(mapInputSnapshot)); }
  async getLatestInputSnapshot(episodeId: string, identity: { profileVersionId: string; requirementSetId: string; requirementSetVersion: number }, options?: TransportRequestOptions) { const query = new URLSearchParams({ profileVersionId: identity.profileVersionId, requirementSetId: identity.requirementSetId, requirementSetVersion: String(identity.requirementSetVersion) }); const e = await this.transport.get<EvaluationInputSnapshotEnvelope>(`/v1/episodes/${part(episodeId)}/evaluation-input-snapshots/latest?${query}`, options); return mapEnvelope("evaluationInput", e, mapInputSnapshot); }
  async getInputSnapshot(snapshotId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationInputSnapshotEnvelope>(`/v1/evaluation-input-snapshots/${part(snapshotId)}`, options); return mapEnvelope("evaluationInput", e, mapInputSnapshot); }
  async getInputMaterial(snapshotId: string, source: "domain" | "provider", options?: TransportRequestOptions) { const e = await this.transport.get<EvaluationInputMaterialEnvelope>(`/v1/evaluation-input-snapshots/${part(snapshotId)}/${source}`, options); return mapEnvelope("evaluationInput", e, (data) => data ? mapInputMaterial(data) : null); }
  async reconcileInputSnapshot(episodeId: string, profileVersionId: string, options?: TransportRequestOptions) { const e = await this.transport.post<EvaluationInputReconcileEnvelope>(`/v1/episodes/${part(episodeId)}/evaluation-input-snapshots/reconcile`, { evaluationProfileVersionId: profileVersionId }, options); return mapEnvelope("evaluationInput", e, (data) => data as unknown as Record<string, unknown>); }

  async listEvidenceBundles(_query: EvidenceQuery = {}) { const e = await this.transport.get<EvidenceBundleListEnvelope>("/v1/evidence-bundles"); return mapEnvelope("evidenceBundles", e, (rows) => rows.map(mapEvidenceBundleSummary)); }
  async getEvidence(bundleId: string): Promise<ApiResource<EvidenceDetail>> { const [bundle, timeline] = await Promise.all([this.transport.get<EvidenceBundleEnvelope>(`/v1/evidence-bundles/${part(bundleId)}`), this.transport.get<EvidenceRecordListEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/timeline`)]); return { data: mapEvidenceDetail(bundle.data, timeline.data), meta: mergeMeta("evidenceBundle", [metaFromEnvelope("evidenceBundle", bundle), metaFromEnvelope("evidenceTimeline", timeline)]) }; }
  async getEvidenceRecords(bundleId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvidenceRecordListEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/records`, options); return mapEnvelope("evidenceBundle", e, (rows) => rows.map(mapEvidenceRecord)); }
  async getEvidenceTimeline(bundleId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvidenceRecordListEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/timeline`, options); return mapEnvelope("evidenceTimeline", e, (rows) => rows.map(mapEvidenceRecord)); }
  async getEvidenceGraph(bundleId: string, options?: TransportRequestOptions) { const e = await this.transport.get<EvidenceGraphEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/graph`, options); return mapEnvelope("evidenceGraph", e, mapEvidenceGraph); }
  async getEvidenceDiff(bundleId: string, otherBundleId: string, mode?: string, options?: TransportRequestOptions) { const q = new URLSearchParams({ otherBundleId }); set(q, "mode", mode); const e = await this.transport.get<EvidenceDiffEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/diff?${q}`, options); return mapEnvelope("evidenceDiff", e, mapEvidenceDiff); }
  async getEvidenceUsage(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>> { const e = await this.transport.get<EvidenceUsageEnvelope>(`/v1/evidence-bundles/${part(bundleId)}/usage`, options); return mapEnvelope("evidenceUsage", e, (data) => data as unknown as Record<string, unknown>); }

  async getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> { return this.getOverview(input); }
  async getAnalyticsModule(key: string, input: OverviewInput, options?: TransportRequestOptions) {
    if (!analyticsKeys.includes(key as typeof analyticsKeys[number])) throw new Error(`Unknown analytics module: ${key}`);
    try {
      const envelope = await this.transport.get<CapabilityEnvelopeLike<unknown>>(`/v1/analytics/${key}?${analysisQuery(input)}`, options);
      return mapEnvelope("analytics", envelope, (data) => mapAnalyticsModule(key, data));
    } catch (error) {
      if (!(error instanceof BenchmarkApiHttpError)) throw error;
      return { data: mapAnalyticsModule(key, []), meta: capabilityMeta("analytics", { mocked: false, mode: "http", availability: "unavailable", reasonCodes: [error.code], unavailableFields: [key], warnings: [`${key}: ${error.message}`] }) };
    }
  }

  async listReports() { const e = await this.transport.get<ReportListEnvelope>("/v1/reports"); return mapEnvelope("reports", e, (rows) => rows.map(mapReport)); }
  async createReport(input: { reportType: "snapshot" | "run" | "comparison" | "evaluation"; sourceId: string; format: "json" | "markdown" | "html" }, options?: TransportRequestOptions) { const e = await this.transport.post<ReportEnvelope>("/v1/reports", { ...input, createdBy: "integration-console" }, options); return mapEnvelope("reports", e, mapReport); }
  async getReportContent(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportContentView>> { const e = await this.transport.get<ReportContentEnvelope>(`/v1/reports/${part(reportId)}/content`, options); return mapEnvelope("reports", e, (data) => ({ reportId: data.reportId, mediaType: data.mediaType, content: data.content, contentHash: data.contentHash ?? null })); }
  async getReportDownload(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportDownloadView>> { const e = await this.transport.get<ReportDownloadEnvelope>(`/v1/reports/${part(reportId)}/download`, options); return mapEnvelope("reportDownload", e, (data) => data); }

  async listAlerts() { const e = await this.transport.get<AttentionItemListEnvelope>("/v1/attention-items"); return mapEnvelope("alerts", e, (rows) => rows.map(mapAttention)); }
  async getAttention(attentionId: string, options?: TransportRequestOptions) { const e = await this.transport.get<AttentionItemEnvelope>(`/v1/attention-items/${part(attentionId)}`, options); return mapEnvelope("alerts", e, mapAttention); }
  async updateAttention(attentionId: string, state: "open" | "acknowledged" | "resolved" | "ignored", options?: TransportRequestOptions): Promise<ApiResource<AlertRecord>> { const e = await this.transport.patch<AttentionStateEnvelope>(`/v1/attention-items/${part(attentionId)}`, { state, actor: "integration-console", note: `Console integration ${state}` }, options); const raw = e.data as unknown as { attention?: unknown }; return mapEnvelope("alerts", e, () => mapAttention((raw.attention ?? e.data) as never)); }

  async getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>> {
    const [ready, status, contracts, projections] = await Promise.allSettled([
      this.transport.get<Ready>("/ready"),
      this.transport.get<SystemStatusEnvelope>("/v1/system/status"), this.transport.get<SystemContractsEnvelope>("/v1/system/contracts"), this.transport.get<SystemProjectionsEnvelope>("/v1/system/projections"),
    ]);
    const data = mapSystemWorkspace(status.status === "fulfilled" ? status.value.data : {}, contracts.status === "fulfilled" ? contracts.value.data : {}, projections.status === "fulfilled" ? projections.value.data : {});
    if (ready.status === "fulfilled") data.services.unshift({ name: "ready", role: "后端依赖与合同真实就绪状态", status: "healthy", detail: JSON.stringify(ready.value) });
    else data.services.unshift({ name: "ready", role: "后端依赖与合同真实就绪状态", status: "degraded", detail: ready.reason instanceof Error ? ready.reason.message : String(ready.reason) });
    const fulfilled = [status, contracts, projections].flatMap((result) => result.status === "fulfilled" ? [metaFromEnvelope("systemWorkspace", result.value)] : []);
    const meta = mergeMeta("systemWorkspace", fulfilled);
    const rejected = [ready, status, contracts, projections].filter((result) => result.status === "rejected");
    if (rejected.length) {
      meta.availability = fulfilled.length ? "partial" : "unavailable";
      meta.reasonCodes.push(...rejected.map((result) => result.status === "rejected" && result.reason instanceof BenchmarkApiHttpError ? result.reason.code : "SYSTEM_MODULE_UNAVAILABLE"));
      meta.warnings.push("部分系统控制面端点不可用；已保留可读取的合同与投影状态。");
    }
    return { data, meta };
  }

  async getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>> {
    const paths: Record<ResourceKind, string> = { candidate: `/v1/candidates/${part(id)}`, baseline: `/v1/baselines/${part(id)}`, dataset: `/v1/datasets/${part(id)}`, profile: `/v1/evaluation-profiles/${part(id)}` };
    const keys: Record<ResourceKind, CapabilityKey> = { candidate: "candidateDetail", baseline: "baselineDetail", dataset: "datasetDetail", profile: "profileDetail" };
    const e = await this.transport.get<CapabilityEnvelopeLike<unknown>>(paths[kind]);
    return mapEnvelope(keys[kind], e, (data) => mapResource(kind, data));
  }
}

function analysisQuery(input: OverviewInput) {
  const query = new URLSearchParams();
  set(query, "candidateId", input.candidateId); set(query, "baselineId", input.baselineId); set(query, "datasetVersion", input.datasetVersion);
  set(query, "profileVersionId", input.profileVersionId); set(query, "runId", input.runId); set(query, "track", cleanAll(input.track)); set(query, "riskLevel", cleanAll(input.risk)); set(query, "period", input.period);
  return query;
}
function evalPath(id: string, section: string) { return `/v1/evaluations/${part(id)}/${section}`; }
function part(value: string) { return encodeURIComponent(value); }
function set(query: URLSearchParams, key: string, value: string | undefined) { if (value) query.set(key, value); }
function cleanAll(value: string | undefined) { return value === "all" ? undefined : value; }
function fulfilled(results: PromiseSettledResult<unknown>[]) { return results.flatMap((result) => result.status === "fulfilled" ? [result.value as CapabilityEnvelopeLike<unknown>] : []); }
function rejected(results: PromiseSettledResult<unknown>[]) { return results.flatMap((result) => result.status === "rejected" ? [result.reason instanceof Error ? result.reason.message : String(result.reason)] : []); }
function value<T>(result: PromiseSettledResult<T>): T | undefined { return result.status === "fulfilled" ? result.value : undefined; }
function aggregate(key: CapabilityKey, envelopes: CapabilityEnvelopeLike<unknown>[], errors: string[]) {
  const meta = mergeMeta(key, envelopes.map((envelope) => metaFromEnvelope(key, envelope)));
  if (!errors.length) return meta;
  return capabilityMeta(key, { mocked: false, mode: "http", availability: "partial", reasonCodes: [...meta.reasonCodes, "SUBRESOURCE_UNAVAILABLE"], unavailableFields: [...meta.unavailableFields, ...errors], warnings: [...meta.warnings, ...errors], watermark: meta.watermark, projectionLagMs: meta.projectionLagMs, contracts: meta.contracts });
}
