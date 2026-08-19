import overviewBlockedJson from "./data/overview-blocked.json";
import overviewReadyJson from "./data/overview-ready.json";
import overviewInvalidJson from "./data/overview-invalid.json";
import runsJson from "./data/runs.json";
import comparisonJson from "./data/comparison.json";
import evaluationJson from "./data/evaluation.json";
import evidenceJson from "./data/evidence.json";
import type {
  CaseResult,
  ComparisonDetail,
  EvaluationDetail,
  EvidenceDetail,
  OverviewSnapshot,
  RunDashboard,
  RunSummary,
  Scenario,
  UiDataState,
} from "../types";

const overviewSources: Record<Scenario, OverviewSnapshot> = {
  blocked: overviewBlockedJson as unknown as OverviewSnapshot,
  ready: overviewReadyJson as unknown as OverviewSnapshot,
  invalid: overviewInvalidJson as unknown as OverviewSnapshot,
};

const metricScores = [
  [92, 88, 83, 85, 84, 86, 79, 91, 87, 66, 89, 69, 72, 77, 72],
  [87, 88, 83, 83, 81, 84, 76, 91, 88, 80, 69, 65, 70, 72, 72],
  [80, 78, 63, 68, 74, 66, 63, 63, 89, 82, 40, 55, 62, 46, 46],
  [94, 92, 88, 91, 86, 85, 91, 93, 92, 83, 88, 91, 93, 88, 88],
  [92, 88, 82, 86, 88, 83, 85, 83, 85, 87, 80, 79, 73, 70, 70],
];

const metricTracks = ["Core", "Skill", "MCP", "Node", "Cross"];

function makeMetricHeatmap() {
  return metricTracks.flatMap((track, trackIndex) =>
    metricScores[trackIndex].map((score, metricIndex) => ({
      track,
      metric: `M${metricIndex + 1}`,
      score,
      formalCount: Math.max(3, 16 - trackIndex * 2),
      diagnosticCount: trackIndex === 2 && metricIndex >= 10 ? 3 : 0,
      delta: trackIndex === 2 && metricIndex >= 10 ? -14.2 : metricIndex % 4 === 0 ? 2.1 : 0,
    })),
  );
}

function blankOverview(source: OverviewSnapshot): OverviewSnapshot {
  return {
    ...source,
    snapshot: {
      ...source.snapshot,
      dataStatus: "empty",
      moduleErrors: [],
    },
    releaseGate: {
      status: "invalid",
      blockingReasons: ["当前筛选条件没有可评价数据"],
    },
    kpis: {
      qualityScore: null,
      qualityDelta: null,
      passRate: null,
      passDelta: null,
      provenFatal: null,
      requiredHgFailures: null,
      notReady: null,
      regressions: null,
      formalEvaluationRate: null,
      criticalRiskPassRate: null,
    },
    analysisConclusions: [],
    attentionItems: [],
    qualityTrend: [],
    regressionWaterfall: null,
    trackRiskMatrix: [],
    metricHeatmap: [],
    evidenceReadinessFunnel: {
      caseRepetitions: 0,
      episodeResolved: 0,
      manifestSealed: 0,
      bundleComplete: 0,
      evaluationReady: 0,
      formalEvaluation: 0,
      lossReasons: {},
    },
    qualityStabilityPoints: [],
    regressionContributors: [],
    scoreDistribution: null,
    anomalyTimeline: [],
    operationalSummary: [],
    systemStatus: [],
    recentRuns: [],
  };
}

export function buildOverview(scenario: Scenario, state: UiDataState = "loaded"): OverviewSnapshot {
  const source = structuredClone(overviewSources[scenario]);
  source.snapshot = {
    ...source.snapshot,
    dataStatus: scenario === "invalid" ? "partial" : "complete",
    moduleErrors:
      scenario === "invalid"
        ? [
            { module: "formalEvaluation", reason: "Formal coverage is only 31%." },
            { module: "martProjection", reason: "Projection lag is 180 seconds." },
          ]
        : [],
  };
  source.metricHeatmap = makeMetricHeatmap();

  if (scenario === "ready") {
    const latest = source.qualityTrend.at(-1);
    if (latest) {
      latest.meanScore = 92.6;
      latest.passRate = 96.3;
      latest.criticalRiskPassRate = 100;
      latest.p10 = 81;
    }
  }

  if (scenario === "invalid") {
    source.scoreDistribution = null;
    source.regressionWaterfall = null;
    source.metricHeatmap = [];
  }

  if (state === "empty") return blankOverview(source);
  if (state === "stale") {
    source.snapshot.dataStatus = "stale";
    source.snapshot.projectionLagMs = 68_000;
    source.snapshot.moduleErrors = [
      { module: "martProjection", reason: "The latest refresh failed; previous snapshot retained." },
    ];
  }
  if (state === "partial") {
    source.snapshot.dataStatus = "partial";
    source.snapshot.moduleErrors = [
      { module: "scoreDistribution", reason: "Percentile algorithm release unavailable." },
      { module: "operationalSummary", reason: "Provider samples are incomplete." },
    ];
    source.releaseGate = {
      status: "invalid",
      blockingReasons: ["部分模块不可用，不能形成新的正式发布判断"],
    };
    source.scoreDistribution = null;
    source.operationalSummary = source.operationalSummary.slice(0, 2);
  }
  return source;
}

export const runSummaries = (runsJson as unknown as { data: RunSummary[] }).data;

export const caseResults: CaseResult[] = [
  {
    caseId: "MCP-RESTART-017",
    title: "Remote task restart must preserve durable receipt chain",
    track: "mcp",
    risk: "critical",
    repetitions: 3,
    verdict: "HG",
    score: 48,
    stability: 33,
    baselineDelta: -44,
    failureType: "EVIDENCE_FAILURE",
    change: "NEW_GATE_FAILURE",
    gates: ["HG4", "HG7"],
    missingEvidence: ["runtime.receipt"],
    evaluationId: "eval-mcp17",
    bundleId: "bundle-cand-mcp17",
  },
  {
    caseId: "MCP-RESTART-021",
    title: "Continuation after provider reconnect must reconcile outcome",
    track: "mcp",
    risk: "high",
    repetitions: 3,
    verdict: "HG",
    score: 57,
    stability: 67,
    baselineDelta: -25,
    failureType: "EVIDENCE_FAILURE",
    change: "NEW_GATE_FAILURE",
    gates: ["HG4"],
    missingEvidence: ["runtime.receipt"],
    evaluationId: "eval-mcp17",
    bundleId: "bundle-cand-mcp17",
  },
  {
    caseId: "SKILL-AREA-010",
    title: "Area patrol replanning under changing constraints",
    track: "skill",
    risk: "high",
    repetitions: 3,
    verdict: "C",
    score: 55,
    stability: 67,
    baselineDelta: -31,
    failureType: "AGENT_FAILURE",
    change: "REGRESSED",
    gates: [],
    missingEvidence: [],
    evaluationId: "eval-skill10",
  },
  {
    caseId: "CORE-AMB-012",
    title: "Ambiguous goal resolution with evidence-backed clarification",
    track: "core",
    risk: "high",
    repetitions: 3,
    verdict: "A",
    score: 88,
    stability: 100,
    baselineDelta: 7,
    failureType: "NONE",
    change: "IMPROVED",
    gates: [],
    missingEvidence: [],
    evaluationId: "eval-core12",
  },
  {
    caseId: "MCP-CONT-015",
    title: "MCP task continuation with terminal verification",
    track: "mcp",
    risk: "high",
    repetitions: 3,
    verdict: "B",
    score: 82,
    stability: 100,
    baselineDelta: null,
    failureType: "NONE",
    change: "RECOVERED",
    gates: [],
    missingEvidence: [],
    evaluationId: "eval-mcp15",
  },
  {
    caseId: "NODE-CTRL-004",
    title: "Node control configuration reconciliation",
    track: "node",
    risk: "low",
    repetitions: 3,
    verdict: "A",
    score: 92,
    stability: 100,
    baselineDelta: 8,
    failureType: "NONE",
    change: "UNCHANGED",
    gates: [],
    missingEvidence: [],
    evaluationId: "eval-core12",
  },
];

export function buildRunDashboard(runId: string): RunDashboard {
  const run = runSummaries.find((item) => item.runId === runId) ?? runSummaries[0];
  return {
    run,
    snapshot: {
      snapshotId: `run-${run.runId}-snapshot-001`,
      watermark: "2026-08-15T20:31:42Z",
      projectionLagMs: 3200,
      dataStatus: "complete",
      moduleErrors: [],
    },
    trackSummary: [
      { label: "Core", value: 93 },
      { label: "Skill", value: 87 },
      { label: "MCP", value: 76 },
      { label: "Node", value: 91 },
      { label: "Cross", value: 84 },
    ],
    riskSummary: [
      { label: "Critical", value: 75 },
      { label: "High", value: 82 },
      { label: "Medium", value: 90 },
      { label: "Low", value: 96 },
    ],
    dimensions: [
      { label: "Goal & State", score: 88 },
      { label: "Planning", score: 79 },
      { label: "Decision & Safety", score: 72 },
      { label: "Execution & Evidence", score: 61 },
      { label: "Closure", score: 66 },
    ],
    cases: caseResults,
  };
}

export const comparisonDetail = comparisonJson as unknown as ComparisonDetail;
export const evaluationDetail = evaluationJson as unknown as EvaluationDetail;
export const evidenceDetail = evidenceJson as unknown as EvidenceDetail;
