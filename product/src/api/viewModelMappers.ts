import type {
  AttentionItem,
  BenchmarkCase,
  BenchmarkRun,
  CaseResultItem,
  ComparisonCase,
  DashboardOverviewResponse,
  EvaluationDimension,
  EvaluationEvidenceGrade,
  EvaluationFatal,
  EvaluationFinding,
  EvaluationHardGate,
  EvaluationInputMaterial,
  EvaluationInputSnapshot,
  EvaluationInputSourceRef,
  EvaluationMetric,
  EvaluationReadiness,
  EvaluationSummary,
  EvidenceBundle,
  EvidenceDiff,
  EvidenceGraph,
  EvidenceRecord,
  Report,
  TelemetryProvenance,
} from "./generated/model";
import type {
  AlertRecord,
  AnalysisConclusion,
  ApiResource,
  AnalyticsModuleView,
  CapabilityMeta,
  CaseDetail,
  CaseResult,
  ComparisonCase as ComparisonCaseView,
  ComparisonDetail,
  ContextOption,
  ContextOptionsView,
  EvaluationDimensionView,
  EvaluationEvidenceGradeView,
  EvaluationFatalView,
  EvaluationFindingView,
  EvaluationHardGateView,
  EvaluationHeaderView,
  EvaluationInputMaterialView,
  EvaluationInputSnapshotView,
  EvaluationInputSourceRefView,
  EvaluationMetricView,
  EvaluationReadinessView,
  EvaluationSummary as EvaluationSummaryView,
  EvidenceBundleSummary,
  EvidenceDetail,
  EvidenceDiffView,
  EvidenceGraphView,
  EvidenceRecordView,
  OverviewSnapshot,
  ReportRecord,
  ResourceDetail,
  ResourceKind,
  RunDashboard,
  RunSummary,
  SystemWorkspace,
  TelemetryProvenanceView,
} from "../types";
import { capabilityMeta, type CapabilityKey } from "./capability-map";

export interface CapabilityEnvelopeLike<T> {
  operationId?: string;
  data: T;
  availability?: {
    status?: "available" | "partial" | "unavailable";
    reasonCodes?: string[];
    unavailableFields?: string[];
  };
  warnings?: string[];
  watermark?: string | null;
  projectionLagMs?: number | null;
  contracts?: string[];
  generatedAt?: string;
}

export function mapEnvelope<TBackend, TView>(
  key: CapabilityKey,
  envelope: CapabilityEnvelopeLike<TBackend>,
  mapper: (data: TBackend) => TView,
): ApiResource<TView> {
  return { data: mapper(envelope.data), meta: metaFromEnvelope(key, envelope) };
}

export function metaFromEnvelope(
  key: CapabilityKey,
  envelope: Omit<CapabilityEnvelopeLike<unknown>, "data">,
): CapabilityMeta {
  return capabilityMeta(key, {
    mocked: false,
    mode: "http",
    operationId: envelope.operationId,
    availability: envelope.availability?.status ?? "available",
    reasonCodes: envelope.availability?.reasonCodes ?? [],
    unavailableFields: envelope.availability?.unavailableFields ?? [],
    warnings: envelope.warnings ?? [],
    watermark: envelope.watermark ?? null,
    projectionLagMs: envelope.projectionLagMs ?? null,
    contracts: envelope.contracts ?? [],
    generatedAt: envelope.generatedAt,
  });
}

export function mergeMeta(key: CapabilityKey, metas: CapabilityMeta[]): CapabilityMeta {
  const availability = metas.some((item) => item.availability === "unavailable")
    ? metas.some((item) => item.availability === "available" || item.availability === "partial") ? "partial" : "unavailable"
    : metas.some((item) => item.availability === "partial") ? "partial" : "available";
  return capabilityMeta(key, {
    mocked: false,
    mode: "http",
    availability,
    reasonCodes: unique(metas.flatMap((item) => item.reasonCodes)),
    unavailableFields: unique(metas.flatMap((item) => item.unavailableFields)),
    warnings: unique(metas.flatMap((item) => item.warnings)),
    watermark: metas.map((item) => item.watermark).filter((item): item is string => Boolean(item)).sort()[0] ?? null,
    projectionLagMs: maxNullable(metas.map((item) => item.projectionLagMs)),
    contracts: unique(metas.flatMap((item) => item.contracts)),
  });
}

export function mapOverview(data: DashboardOverviewResponse): OverviewSnapshot {
  const raw = record(data);
  const snapshot = record(raw.snapshot);
  const context = record(raw.context);
  const filters = record(context.filters);
  const release = nullableRecord(raw.releaseGate);
  const kpis = nullableRecord(raw.kpis);
  const funnel = nullableRecord(raw.evidenceReadinessFunnel);
  const operational = record(raw.operationalSummary);
  const telemetry = nullableRecord(raw.telemetryTrust);
  const moduleErrors = array(snapshot.moduleErrors).map((item) => {
    const row = record(item);
    return { module: text(row.module), code: optionalText(row.code) ?? undefined, reason: optionalText(row.message) ?? optionalText(row.reason) ?? "UNKNOWN" };
  });
  return {
    snapshot: {
      snapshotId: text(snapshot.snapshotId, "unavailable"),
      watermark: nullableText(snapshot.watermark),
      projectionLagMs: nullableNumber(snapshot.projectionLagMs),
      dataStatus: oneOf(text(snapshot.dataStatus), ["complete", "partial", "stale", "empty"] as const, "partial"),
      moduleErrors,
    },
    context: {
      candidate: { id: text(context.candidateId ?? context.candidateSnapshotId, "unavailable"), runtimeVersion: text(context.candidateSnapshotId, "—"), commit: "—" },
      baseline: { id: text(context.baselineId, "unavailable"), runtimeVersion: "—", commit: "—" },
      dataset: { id: text(context.datasetVersionRef ?? context.datasetVersion, "unavailable"), version: text(context.datasetVersion, "—") },
      profile: { id: text(context.profileVersionId, "unavailable"), version: text(context.profileVersion, "—") },
      run: { id: text(context.runId, "unavailable"), status: text(filters.period, "—") },
    },
    releaseGate: release ? {
      status: oneOf(text(release.status), ["blocked", "ready", "invalid", "warning"] as const, "unavailable"),
      blockingReasons: strings(release.blockingReasons),
    } : { status: "unavailable", blockingReasons: moduleErrors.map((item) => item.code ?? item.reason) },
    kpis: {
      qualityScore: nullableNumber(kpis?.qualityScore), qualityDelta: nullableNumber(kpis?.qualityDelta),
      passRate: nullableNumber(kpis?.passRate), passDelta: nullableNumber(kpis?.passDelta),
      provenFatal: nullableNumber(kpis?.provenFatal), requiredHgFailures: nullableNumber(kpis?.requiredHgFailures),
      notReady: nullableNumber(kpis?.notReady), regressions: nullableNumber(kpis?.regressions),
      formalEvaluationRate: nullableNumber(kpis?.formalEvaluationRate), criticalRiskPassRate: nullableNumber(kpis?.criticalRiskPassRate),
    },
    analysisConclusions: array(raw.analysisConclusions).map(mapConclusion),
    attentionItems: array(raw.attentionItems).map((item) => mapAttentionCompact(item as AttentionItem)),
    qualityTrend: array(raw.qualityTrend).map((item) => {
      const row = record(item);
      return { label: text(row.label), meanScore: nullableNumber(row.meanScore), passRate: nullableNumber(row.passRate), criticalRiskPassRate: nullableNumber(row.criticalRiskPassRate), p10: nullableNumber(row.p10) };
    }),
    regressionWaterfall: mapWaterfall(raw.regressionWaterfall),
    trackRiskMatrix: array(raw.trackRiskMatrix).map((item) => { const row = record(item); return { track: text(row.track), risk: text(row.risk), passRate: nullableNumber(row.passRate) }; }),
    metricHeatmap: array(raw.metricHeatmap).map((item) => { const row = record(item); return { track: text(row.track ?? row.dimensionId, "unavailable"), metric: text(row.metric ?? row.metricId), score: nullableNumber(row.score ?? row.rawScoreMean), formalCount: numberOr(row.formalCount ?? row.evaluationCount, 0), diagnosticCount: numberOr(row.diagnosticCount ?? row.e0Count, 0), delta: nullableNumber(row.delta) }; }),
    evidenceReadinessFunnel: {
      caseRepetitions: nullableNumber(funnel?.caseRepetitions ?? funnel?.caseCount),
      episodeResolved: nullableNumber(funnel?.episodeResolved ?? funnel?.evaluatedCount),
      manifestSealed: nullableNumber(funnel?.manifestSealed), bundleComplete: nullableNumber(funnel?.bundleComplete),
      evaluationReady: nullableNumber(funnel?.evaluationReady ?? funnel?.readyCount), formalEvaluation: nullableNumber(funnel?.formalEvaluation),
      lossReasons: numericRecord(funnel?.lossReasons),
    },
    sourceAwareEvidenceFunnel: record(raw.sourceAwareEvidenceFunnel),
    qualityStabilityPoints: array(raw.qualityStabilityPoints).map((item) => { const row = record(item); return { caseId: text(row.caseId ?? row.benchmarkRunId), track: text(row.track), risk: text(row.risk), averageScore: numberOr(row.averageScore ?? row.qualityScoreMean, 0), passStability: numberOr(row.passStability, 0), repetitions: numberOr(row.repetitions ?? row.repetitionCount, 0) }; }).filter((row) => row.caseId !== ""),
    regressionContributors: array(raw.regressionContributors).map((item) => { const row = record(item); return { label: text(row.label ?? row.contributorId), impactPercent: numberOr(row.impactPercent ?? row.scoreDelta, 0) }; }),
    scoreDistribution: mapScoreDistribution(raw.scoreDistribution),
    anomalyTimeline: array(raw.anomalyTimeline).map((item) => { const row = record(item); return { at: text(row.at ?? row.occurredAt), severity: text(row.severity), title: text(row.title ?? row.kind), target: record(row.target) as { type: string; id: string } }; }),
    operationalSummary: array(operational.data ?? raw.operationalSummary).map((item) => { const row = record(item); return { metric: text(row.metric ?? row.metricId), current: nullableNumber(row.current ?? row.value), baseline: nullableNumber(row.baseline), unit: text(row.unit), changePercent: nullableNumber(row.changePercent) }; }),
    systemStatus: array(raw.systemStatus).map((item) => { const row = record(item); return { component: text(row.component), status: text(row.status), detail: optionalText(row.detail) }; }),
    telemetryTrust: telemetry ? mapTelemetryTrust(telemetry) : null,
    recentRuns: array(raw.recentRuns).map((item) => { const row = record(item); return { runId: text(row.runId), candidate: text(row.candidate), caseCount: numberOr(row.caseCount, 0), status: text(row.status ?? "projected"), completedAt: text(row.completedAt) }; }),
  };
}

export function mapContextOptions(data: unknown): ContextOptionsView {
  const raw = record(data);
  const option = (item: unknown, idKeys: string[], labelKeys: string[]): ContextOption => {
    const row = record(item);
    const id = firstText(row, idKeys) ?? "unavailable";
    return { id, label: firstText(row, labelKeys) ?? id, secondary: firstText(row, ["runtimeVersion", "version", "status"]) ?? undefined };
  };
  const defaults = record(raw.defaults);
  return {
    candidates: array(raw.candidates).map((item) => option(item, ["candidateSnapshotId", "candidateId", "id"], ["runtimeVersion", "candidateId", "candidateSnapshotId"])),
    baselines: array(raw.baselines).map((item) => option(item, ["baselineId", "id"], ["baselineId", "candidateSnapshotId"])),
    datasets: array(raw.datasets).map((item) => option(item, ["datasetVersionRef", "datasetId", "id"], ["datasetVersionRef", "name"])),
    profiles: array(raw.evaluationProfiles).map((item) => option(item, ["profileVersionId", "id"], ["profileVersionId", "name"])),
    runs: array(raw.runs).map((item) => option(item, ["runId", "id"], ["runId", "status"])),
    defaults: {
      candidateSnapshotId: nullableText(defaults.candidateSnapshotId), baselineId: nullableText(defaults.baselineId),
      datasetVersionRef: nullableText(defaults.datasetVersionRef), profileVersionId: nullableText(defaults.profileVersionId),
    },
    compatibilityPolicy: text(raw.compatibilityPolicy),
  };
}

export function mapRunSummary(data: BenchmarkRun): RunSummary {
  const row = record(data);
  const passed = nullableNumber(row.passedCaseCount);
  const completed = nullableNumber(row.completedCaseCount);
  return {
    runId: text(row.runId, "unavailable"), candidate: text(row.runtimeVersion ?? row.candidateId ?? row.candidateSnapshotId, "—"),
    dataset: text(row.datasetVersionRef ?? row.datasetVersion, "—"), profile: text(row.profileVersionId, "—"),
    cases: nullableNumber(row.totalCaseCount), completed,
    passRate: passed != null && completed != null && completed > 0 ? Math.round((passed / completed) * 10_000) / 100 : null,
    qualityScore: null, fatal: null, hg: null, nr: nullableNumber(row.notReadyCaseCount), releaseGate: "unavailable",
    status: text(row.status, "unavailable"), completedAt: text(row.completedAt ?? row.updatedAt ?? row.createdAt, "—"),
  };
}

export function mapCaseResult(data: CaseResultItem | unknown): CaseResult {
  const row = record(data);
  return {
    caseId: text(row.caseId, "unavailable"), title: text(row.title ?? row.caseTitle ?? row.caseId, "—"),
    track: text(row.track, "unavailable"), risk: text(row.riskLevel ?? row.risk, "unavailable"),
    repetitions: numberOr(row.repetitions ?? row.repetitionCount, 1), verdict: text(row.level ?? row.verdict, "NR"),
    score: nullableNumber(row.qualityScore ?? row.score), stability: nullableNumber(row.stability ?? row.passStability),
    baselineDelta: nullableNumber(row.scoreDelta ?? row.baselineDelta), failureType: text(row.failureType ?? row.failureClass, "—"),
    change: text(row.changeType ?? row.change, "NON_COMPARABLE"), gates: strings(row.gates ?? row.failedGates ?? row.failedGateIds),
    missingEvidence: strings(row.missingEvidence ?? row.missingEvidenceTypes), evaluationId: text(row.evaluationId, "unavailable"),
    bundleId: optionalText(row.bundleSnapshotId ?? row.bundleId),
  };
}

export function mapRunDashboard(data: unknown, meta: CapabilityMeta, extras?: { repetitions?: unknown[]; events?: unknown[]; evidenceFunnel?: unknown; releaseGate?: unknown }): RunDashboard {
  const raw = record(data);
  const authority = raw.authority as BenchmarkRun;
  const run = mapRunSummary(authority);
  const release = nullableRecord(raw.releaseGate);
  const analytics = nullableRecord(raw.analytics);
  run.qualityScore = nullableNumber(analytics?.qualityScore ?? analytics?.meanScore);
  run.passRate = nullableNumber(analytics?.passRate) ?? run.passRate;
  run.fatal = nullableNumber(analytics?.provenFatalCount);
  run.hg = nullableNumber(analytics?.hardGateFailedCount);
  run.releaseGate = text(release?.status, "unavailable");
  const cases = array(raw.cases).length ? array(raw.cases) : array(raw.results);
  return {
    run,
    snapshot: { snapshotId: text(raw.snapshotId, "unavailable"), watermark: meta.watermark, projectionLagMs: meta.projectionLagMs, dataStatus: meta.availability === "available" ? "complete" : "partial", moduleErrors: meta.reasonCodes.map((code) => ({ module: "runDashboard", code, reason: code })) },
    trackSummary: array(raw.tracks).map((item) => { const row = record(item); return { label: text(row.track ?? row.label), value: numberOr(row.caseCount ?? row.value, 0) }; }),
    riskSummary: array(raw.risks).map((item) => { const row = record(item); return { label: text(row.risk ?? row.label), value: numberOr(row.caseCount ?? row.value, 0) }; }),
    dimensions: array(analytics?.dimensions).map((item) => { const row = record(item); return { label: text(row.dimensionId ?? row.label), score: numberOr(row.score, 0) }; }),
    cases: cases.map(mapCaseResult),
    repetitions: extras?.repetitions ?? [],
    events: extras?.events ?? [],
    evidenceFunnel: extras?.evidenceFunnel ?? null,
    releaseGateDetail: extras?.releaseGate ?? null,
  };
}

export function mapBenchmarkCase(data: BenchmarkCase, extras?: { history?: unknown[]; executions?: unknown[]; expected?: unknown; binding?: unknown; stability?: unknown }): CaseDetail {
  const row = record(data);
  const body = nullableRecord(row.case) ?? {};
  return {
    caseId: text(row.caseId, "unavailable"), title: text(body.title ?? body.name ?? row.caseId, "—"), description: text(body.description, "—"),
    track: text(row.track, "unavailable"), risk: text(row.riskLevel, "unavailable"), status: row.runnable === false ? "draft" : "active",
    owner: text(body.owner, "—"), sourceRevision: numberOr(row.caseVersion, 1), tags: strings(body.tags),
    preconditions: strings(body.preconditions), actions: strings(body.actions ?? body.steps), expectedOutcomes: strings(body.expectedOutcomes),
    requiredEvidenceFamilies: strings(record(extras?.expected).requiredEvidenceFamilies ?? body.requiredEvidenceFamilies),
    requiredGates: strings(record(extras?.binding).requiredGates ?? body.requiredGates),
    executions: array(extras?.executions).map((item, index) => { const x = record(item); return { repetition: numberOr(x.repetition, index + 1), episodeId: text(x.episodeId, "—"), status: oneOf(text(x.status), ["completed", "failed", "pending"] as const, "pending"), verdict: text(x.level ?? x.verdict, "NR"), score: nullableNumber(x.qualityScore ?? x.score), durationMs: nullableNumber(x.durationMs), evaluationId: optionalText(x.evaluationId), bundleId: optionalText(x.bundleSnapshotId) }; }),
    history: array(extras?.history).map((item, index) => { const x = record(item); return { revision: numberOr(x.revision ?? x.caseVersion, index + 1), at: text(x.createdAt ?? x.at, "—"), author: text(x.author ?? x.sourceType, "—"), summary: text(x.summary ?? x.contentHash, "—") }; }),
  };
}

export function mapComparison(data: unknown, caseRows: unknown[] = []): ComparisonDetail {
  const raw = record(data);
  const comparison = record(raw.comparison ?? raw);
  const cases = (caseRows.length ? caseRows : array(raw.cases)).map(mapComparisonCase);
  return {
    comparisonId: text(comparison.comparisonId, "unavailable"),
    baseline: { baselineId: nullableText(comparison.baselineId), runId: nullableText(comparison.baselineRunId) },
    candidate: { runId: nullableText(comparison.candidateRunId), comparable: comparison.isComparable === true ? 1 : comparison.isComparable === false ? 0 : null },
    summary: numericRecord(comparison.summary ?? raw.regressionGroups),
    cases,
  };
}

function mapComparisonCase(data: ComparisonCase | unknown): ComparisonCaseView {
  const row = record(data);
  return {
    caseId: text(row.caseId, "unavailable"), track: text(row.track, "—"), risk: text(row.riskLevel ?? row.risk, "—"),
    baselineVerdict: text(row.baselineLevel, "NR"), baselineScore: nullableNumber(row.baselineScore),
    candidateVerdict: text(row.candidateLevel, "NR"), candidateScore: nullableNumber(row.candidateScore),
    change: text(row.verdict ?? row.comparisonVerdict, "NON_COMPARABLE"), changed: strings(row.reasonCodes ?? row.criticalMetricRegressionIds),
    baselineBundleId: optionalText(row.baselineBundleSnapshotId), candidateBundleId: optionalText(row.candidateBundleSnapshotId),
    evaluationId: text(row.candidateEvaluationId ?? row.evaluationId, "unavailable"),
  };
}

export function mapEvaluationSummary(data: EvaluationSummary): EvaluationSummaryView {
  return {
    evaluationId: data.evaluationId, caseId: data.subjectId, track: "—", risk: "—", verdict: data.level,
    qualityScore: data.qualityScore ?? null, readiness: data.evaluationReadiness === "ready" ? "ready" : "not_ready",
    scoreStatus: data.scoreStatus === "unavailable" ? "not_ready" : data.scoreStatus,
    fatalCount: data.provenFatalCount ?? 0, failedGates: data.hardGateFailedCount ? [`${data.hardGateFailedCount} failed`] : [],
    bundleId: data.bundleSnapshotId, completedAt: data.evaluatedAt ?? "—",
  };
}

export function mapEvaluationHeader(data: EvaluationSummary | unknown): EvaluationHeaderView {
  const row = record(data);
  return {
    evaluationId: text(row.evaluationId, "unavailable"), caseId: text(row.caseId ?? row.subjectId, "unavailable"), episodeId: nullableText(row.episodeId),
    origin: text(row.origin, "unavailable"), profileVersionId: text(row.profileVersionId, "unavailable"), bundleSnapshotId: text(row.bundleSnapshotId, "unavailable"),
    readiness: text(row.evaluationReadiness ?? row.status, "not_ready"), scoreStatus: text(row.scoreStatus, "unavailable"), qualityScore: nullableNumber(row.qualityScore),
    level: text(row.level, "NR"), passed: nullableBoolean(row.passed), createdAt: nullableText(row.evaluatedAt ?? row.createdAt),
  };
}

export function mapEvaluationReadiness(data: EvaluationReadiness): EvaluationReadinessView {
  return { sourceEvidenceReadiness: data.sourceEvidenceReadiness ?? null, evaluationReadiness: data.evaluationReadiness, missingFamilies: data.missingEvidenceTypes ?? [], conflictingFamilies: data.conflictingEvidenceRefs ?? [], reasonCodes: data.reasonCodes ?? [] };
}

export function mapEvidenceGrade(data: EvaluationEvidenceGrade): EvaluationEvidenceGradeView {
  return { family: data.metricId, grade: data.evidenceLevel ?? null, reasonCodes: [...(data.missingEvidenceTypes ?? []), ...(data.conflictRefs ?? [])], evidenceRefs: data.evidenceRefs };
}

export function mapFatal(data: EvaluationFatal): EvaluationFatalView {
  return { id: data.fatalId, matched: data.matched, proofStatus: data.proofStatus, evidenceLevel: data.evidenceLevel ?? null, evidenceRefs: data.evidenceRefs, reasonCodes: data.reasonCodes ?? [] };
}

export function mapHardGate(data: EvaluationHardGate): EvaluationHardGateView {
  return { id: data.gateId, result: data.result, reason: data.reasonCodes?.join(", ") ?? null, evidenceRefs: data.evidenceRefs, reasonCodes: data.reasonCodes ?? [] };
}

export function mapMetric(data: EvaluationMetric): EvaluationMetricView {
  return { id: data.metricId, raw: data.rawScore ?? null, weight: data.weight ?? null, evidenceLevel: data.evidenceLevel ?? null, status: data.formalizationStatus, summary: data.summary ?? null, reasonCodes: data.reasonCodes ?? [] };
}

export function mapDimension(data: EvaluationDimension): EvaluationDimensionView {
  return { id: data.dimensionId, label: data.dimensionId, score: data.score ?? null, threshold: data.threshold ?? null, passed: data.passed ?? null, applicable: data.applicable, metricIds: data.metricIds ?? [] };
}

export function mapFinding(data: EvaluationFinding): EvaluationFindingView {
  return { id: data.findingId, type: data.findingType, severity: data.severity ?? null, summary: data.summary, evidenceRefs: data.evidenceRefs, priority: data.priority ?? null };
}

export function mapInputSource(data: EvaluationInputSourceRef): EvaluationInputSourceRefView {
  return { sourceType: data.sourceType, readiness: "captured", required: null, watermark: data.sourceWatermark, reasonCodes: [], artifactUri: data.artifactUri, artifactHash: data.artifactHash, contentHash: data.sourceContentHash, schemaVersion: data.contractVersion };
}

export function mapTelemetryProvenance(data: TelemetryProvenance): TelemetryProvenanceView {
  return { evaluationId: data.evaluationId, origin: data.origin, inputSnapshotId: data.inputSnapshotId, inputSnapshotContentHash: data.inputSnapshotContentHash, overallReadiness: data.overallReadiness, formalInputEligible: data.formalInputEligible, effectiveWatermark: data.effectiveWatermark, sources: data.sources.map(mapInputSource) };
}

export function mapInputSnapshot(data: EvaluationInputSnapshot): EvaluationInputSnapshotView {
  return { snapshotId: data.snapshotId, contentHash: data.contentHash, episodeId: data.episodeId, profileVersionId: data.profileVersionId, overallReadiness: data.overallReadiness, overallReasonCodes: data.overallReasonCodes, formalInputEligible: data.formalInputEligible, effectiveWatermark: data.effectiveWatermark, artifactUri: data.artifactUri, artifactHash: data.artifactHash, recordedAt: data.recordedAt, sources: data.sources.map(mapInputSource) };
}

export function mapInputMaterial(data: EvaluationInputMaterial): EvaluationInputMaterialView {
  const diagnostics = record(data.externalDiagnostics);
  return { snapshotId: data.snapshotId, source: mapInputSource(data.source), immutable: true, material: data.material, rawTracePath: nullableText(diagnostics.rawTracePath), authority: text(diagnostics.authority, "diagnostic_only") };
}

export function mapEvidenceBundleSummary(data: EvidenceBundle): EvidenceBundleSummary {
  const header = record(data.header);
  return { bundleId: data.bundleSnapshotId, caseId: text(header.caseId, "—"), episodeId: data.episodeId, status: oneOf(text(header.status), ["complete", "partial", "pending"] as const, data.recordCount > 0 ? "complete" : "pending"), manifestRevision: data.manifestRevision, recordCount: data.recordCount, missingFamilies: strings(header.missingFamilies), evaluationId: optionalText(header.evaluationId), bundleHash: data.bundleHash, createdAt: data.createdAt };
}

export function mapEvidenceDetail(data: EvidenceBundle, timeline: EvidenceRecord[] = [], diff?: EvidenceDiff): EvidenceDetail {
  const header = record(data.header);
  return {
    bundleId: data.bundleSnapshotId, episodeId: data.episodeId, manifestRevision: data.manifestRevision,
    status: text(header.status, data.recordCount > 0 ? "complete" : "pending"), recordCount: data.recordCount,
    sequenceRange: timeline.length ? [Number(timeline[0]?.evidenceSequence ?? 0), Number(timeline.at(-1)?.evidenceSequence ?? 0)] : [],
    bundleHash: data.bundleHash, requiredFamilies: strings(header.requiredFamilies), missingFamilies: strings(header.missingFamilies),
    timeline: timeline.map((row) => ({ id: row.recordId, type: row.recordType, label: row.recordFamily, time: row.occurredAt, status: row.sourceSystem })),
    diff: diff ? { baselineBundleId: diff.rightBundleId, added: diff.added.map((item) => ({ id: String(item) })), removed: diff.removed.map((item) => ({ id: String(item) })), changed: diff.changed.map(stringRecord), relationChanges: diff.relationChanges.map(stringRecord) } : { baselineBundleId: "", added: [], removed: [], changed: [], relationChanges: [] },
  };
}

export function mapEvidenceRecord(data: EvidenceRecord): EvidenceRecordView {
  return { recordId: data.recordId, recordFamily: data.recordFamily, recordType: data.recordType, sourceSystem: data.sourceSystem, evidenceSequence: data.evidenceSequence, occurredAt: data.occurredAt, evidenceRefs: data.evidenceRefs, artifactRefs: data.artifactRefs, payloadHash: data.payloadHash, payload: data.payload };
}

export function mapEvidenceGraph(data: EvidenceGraph): EvidenceGraphView {
  return { nodes: data.nodes, edges: data.edges, inferredEdges: data.inferredEdges, warnings: data.warnings };
}

export function mapEvidenceDiff(data: EvidenceDiff): EvidenceDiffView {
  return { mode: data.mode, leftBundleId: data.leftBundleId, rightBundleId: data.rightBundleId, pairs: data.pairs, added: data.added, removed: data.removed, changed: data.changed, relationChanges: data.relationChanges, sequenceChanges: data.sequenceChanges, missingExpectedLinks: data.missingExpectedLinks, warnings: data.warnings };
}

export function mapAnalyticsModule(key: string, data: unknown): AnalyticsModuleView {
  const rows = Array.isArray(data) ? data : data == null ? [] : [data];
  return { key, title: key.replaceAll("-", " "), rows };
}

export function mapReport(data: Report): ReportRecord {
  const format = data.format === "markdown" ? "Markdown" : data.format === "html" ? "HTML" : "JSON";
  return { reportId: data.reportId, title: `${data.reportType} · ${data.sourceId}`, type: data.reportType, status: data.status, scope: data.sourceId, format, sections: [], createdAt: data.createdAt ?? "—", createdBy: data.createdBy ?? "integration-console" };
}

export function mapAttention(data: AttentionItem): AlertRecord {
  const row = record(data);
  const summary = record(row.summary);
  const refs = record(row.refs);
  const priority = text(row.priority, "medium").toLowerCase();
  const severity: AlertRecord["severity"] = priority.includes("critical") || priority === "p0" ? "critical" : priority.includes("high") || priority === "p1" ? "high" : "medium";
  const status = oneOf(text(row.state), ["open", "acknowledged", "resolved", "ignored"] as const, "open");
  return { alertId: text(row.attentionId, "unavailable"), severity, status, title: text(summary.title ?? summary.summary ?? row.fingerprint, "关注项"), source: text(summary.source ?? "benchmark"), targetType: attentionTargetType(refs), targetId: text(refs.caseId ?? refs.runId ?? refs.evaluationId ?? refs.projectionId, "unavailable"), reason: text(summary.reason ?? summary.description ?? row.fingerprint, "—"), createdAt: text(row.stateUpdatedAt, "—"), owner: optionalText(row.stateActor), acknowledgedAt: status === "acknowledged" ? optionalText(row.stateUpdatedAt) : undefined, resolvedAt: status === "resolved" ? optionalText(row.stateUpdatedAt) : undefined };
}

export function mapSystemWorkspace(status: unknown, contracts: unknown, projections: unknown): SystemWorkspace {
  const s = record(status); const c = record(contracts); const p = record(projections);
  const services = ["postgres", "clickhouse", "contracts", "operations", "trust"].map((name) => {
    const value = s[name]; const row = nullableRecord(value);
    const state = value == null ? "degraded" : row?.ready === false || row?.status === "degraded" ? "degraded" : "healthy";
    return { name, role: name === "postgres" ? "Command / Run / Snapshot / Evaluation authority" : name === "clickhouse" ? "Evidence and Analytics projection" : "Backend control plane", status: state as "healthy" | "degraded", detail: JSON.stringify(value ?? null) };
  });
  const contractRows = array(c.releases).map((item, index) => { const row = record(item); return { name: text(row.releaseId ?? row.name, `release-${index + 1}`), version: text(row.version ?? row.releaseVersion, "—"), source: text(row.source ?? row.contentHash, "—"), status: oneOf(text(row.status), ["active", "draft"] as const, "active") }; });
  const frozenProfile = nullableRecord(c.frozenEvaluationProfile);
  if (frozenProfile) contractRows.unshift({ name: text(frozenProfile.profileId, "frozen-evaluation-profile"), version: text(frozenProfile.profileVersion, "—"), source: text(frozenProfile.contentHash, "—"), status: "active" });
  const projectionRows = [...array(p.checkpoints), ...array(p.sourceWatermarks)].map((item, index) => { const row = record(item); return { name: text(row.projectionName ?? row.source ?? row.name, `projection-${index + 1}`), watermark: text(row.watermark ?? row.updatedAt, "—"), lagMs: numberOr(row.lagMs, 0), status: oneOf(text(row.status), ["healthy", "stale"] as const, "stale") }; });
  return { services, contracts: contractRows, projections: projectionRows, adapters: [
    { mode: "http", description: "同源代理访问真实 Benchmark API；失败不会回退。", recommendedFor: "内网集成与验收" },
    { mode: "hybrid", description: "按 capability 显式标记 LIVE/MOCK。", recommendedFor: "并行开发" },
    { mode: "mock", description: "确定性演示数据。", recommendedFor: "离线界面开发" },
    { mode: "msw", description: "HTTP 合同测试。", recommendedFor: "组件测试" },
  ] };
}

export function mapResource(kind: ResourceKind, data: unknown): ResourceDetail {
  const row = record(data);
  const ids: Record<ResourceKind, string[]> = { candidate: ["candidateSnapshotId", "candidateId"], baseline: ["baselineId"], dataset: ["datasetVersionRef", "datasetId"], profile: ["profileVersionId", "profileId"] };
  const id = firstText(row, ids[kind]) ?? "unavailable";
  return { kind, id, title: firstText(row, ["name", "runtimeVersion", "title"]) ?? id, status: firstText(row, ["status", "lifecycleStatus"]) ?? "active", description: firstText(row, ["description", "summary"]) ?? "只读后端注册表资源。", properties: Object.entries(row).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 16).map(([label, value]) => ({ label, value: String(value) })), relations: [], history: [] };
}

function mapConclusion(value: unknown): AnalysisConclusion {
  const row = record(value); const summary = record(row.summary); const drill = record(row.drillDown); const filters = record(drill.filters ?? row.drilldownRefs);
  return { id: text(row.conclusionId ?? row.id), severity: text(row.severity), category: text(row.category ?? row.ruleId), title: text(summary.title ?? row.title ?? row.ruleId, "分析结论"), summary: text(summary.description ?? row.summary, "—"), affectedCases: numberOr(record(row.impact).affectedCases, 0), generatedBy: text(row.generatedBy ?? row.ruleId, "deterministic"), formalizationStatus: text(row.formalizationStatus, "diagnostic"), drillDown: { page: text(drill.page, "/analytics"), filters: stringRecord(filters) } };
}

function mapAttentionCompact(value: AttentionItem) {
  const row = record(value); const summary = record(row.summary);
  return { priority: text(row.priority), title: text(summary.title ?? summary.summary ?? row.fingerprint, "关注项"), count: nullableNumber(summary.count) ?? undefined, value: optionalText(summary.value), delta: nullableNumber(summary.delta) ?? undefined, status: text(row.state, "open") };
}

function mapTelemetryTrust(raw: Record<string, unknown>): NonNullable<OverviewSnapshot["telemetryTrust"]> {
  const availability = record(raw.availability);
  return { status: text(raw.status ?? availability.status, "partial"), reasonCodes: strings(raw.reasonCodes ?? availability.reasonCodes), watermark: nullableText(raw.watermark ?? raw.effectiveWatermark), canonical: record(raw.canonical), domain: record(raw.domain), provider: record(raw.provider) };
}

function mapWaterfall(value: unknown): OverviewSnapshot["regressionWaterfall"] {
  const row = nullableRecord(value); if (!row) return null;
  const values = ["baseline", "recovered", "improved", "regressed", "newHg", "notReady", "candidate"].map((key) => nullableNumber(row[key]));
  if (values.every((item) => item == null)) return null;
  return { baseline: values[0] ?? 0, recovered: values[1] ?? 0, improved: values[2] ?? 0, regressed: values[3] ?? 0, newHg: values[4] ?? 0, notReady: values[5] ?? 0, candidate: values[6] ?? 0 };
}

function mapScoreDistribution(value: unknown): OverviewSnapshot["scoreDistribution"] {
  const row = nullableRecord(value); if (!row) return null;
  const values = [row.p10, row.p25, row.median ?? row.p50, row.p75, row.p90].map(nullableNumber);
  if (values.some((item) => item == null)) return null;
  return { p10: values[0]!, p25: values[1]!, median: values[2]!, p75: values[3]!, p90: values[4]! };
}

function attentionTargetType(refs: Record<string, unknown>): AlertRecord["targetType"] {
  if (refs.caseId) return "case"; if (refs.runId) return "run"; if (refs.evaluationId) return "evaluation"; return "projection";
}

function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function nullableRecord(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown, fallback = ""): string { return typeof value === "string" && value.length ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : fallback; }
function optionalText(value: unknown): string | undefined { return typeof value === "string" && value.length ? value : undefined; }
function nullableText(value: unknown): string | null { return optionalText(value) ?? null; }
function nullableNumber(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null; }
function numberOr(value: unknown, fallback: number): number { return nullableNumber(value) ?? fallback; }
function nullableBoolean(value: unknown): boolean | null { return typeof value === "boolean" ? value : null; }
function strings(value: unknown): string[] { return array(value).map((item) => text(item)).filter(Boolean); }
function numericRecord(value: unknown): Record<string, number> { return Object.fromEntries(Object.entries(record(value)).flatMap(([key, item]) => { const parsed = nullableNumber(item); return parsed == null ? [] : [[key, parsed]]; })); }
function stringRecord(value: unknown): Record<string, string> { return Object.fromEntries(Object.entries(record(value)).map(([key, item]) => [key, text(item, JSON.stringify(item))])); }
function firstText(row: Record<string, unknown>, keys: string[]): string | null { for (const key of keys) { const value = optionalText(row[key]); if (value) return value; } return null; }
function unique(values: string[]): string[] { return [...new Set(values)]; }
function maxNullable(values: Array<number | null>): number | null { const present = values.filter((value): value is number => value != null); return present.length ? Math.max(...present) : null; }
function oneOf<T extends string>(value: string, values: readonly T[], fallback: T): T { return values.includes(value as T) ? value as T : fallback; }
