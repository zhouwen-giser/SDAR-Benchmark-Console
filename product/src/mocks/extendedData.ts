import { caseResults, evaluationDetail, evidenceDetail } from "./mockData";
import type {
  AlertRecord,
  CaseDetail,
  EvaluationDetail,
  EvaluationSummary,
  EvidenceDetail,
  EvidenceBundleSummary,
  ReportRecord,
  ResourceDetail,
  ResourceKind,
  SystemWorkspace,
} from "../types";

export const evaluationSummaries: EvaluationSummary[] = [
  {
    evaluationId: "eval-mcp17",
    caseId: "MCP-RESTART-017",
    track: "mcp",
    risk: "critical",
    verdict: "HG",
    qualityScore: 48,
    readiness: "ready",
    scoreStatus: "formal",
    fatalCount: 0,
    failedGates: ["HG4", "HG7"],
    bundleId: "bundle-cand-mcp17",
    completedAt: "2026-08-15T20:31:18Z",
  },
  {
    evaluationId: "eval-mcp21",
    caseId: "MCP-RESTART-021",
    track: "mcp",
    risk: "high",
    verdict: "HG",
    qualityScore: 57,
    readiness: "ready",
    scoreStatus: "formal",
    fatalCount: 0,
    failedGates: ["HG4"],
    bundleId: "bundle-cand-mcp21",
    completedAt: "2026-08-15T20:30:54Z",
  },
  {
    evaluationId: "eval-skill10",
    caseId: "SKILL-AREA-010",
    track: "skill",
    risk: "high",
    verdict: "C",
    qualityScore: 55,
    readiness: "ready",
    scoreStatus: "formal",
    fatalCount: 0,
    failedGates: [],
    bundleId: "bundle-cand-skill10",
    completedAt: "2026-08-15T20:29:42Z",
  },
  {
    evaluationId: "eval-core12",
    caseId: "CORE-AMB-012",
    track: "core",
    risk: "high",
    verdict: "A",
    qualityScore: 88,
    readiness: "ready",
    scoreStatus: "formal",
    fatalCount: 0,
    failedGates: [],
    bundleId: "bundle-cand-core12",
    completedAt: "2026-08-15T20:28:31Z",
  },
  {
    evaluationId: "eval-mcp15",
    caseId: "MCP-CONT-015",
    track: "mcp",
    risk: "high",
    verdict: "B",
    qualityScore: 82,
    readiness: "ready",
    scoreStatus: "formal",
    fatalCount: 0,
    failedGates: [],
    bundleId: "bundle-cand-mcp15",
    completedAt: "2026-08-15T20:27:55Z",
  },
  {
    evaluationId: "eval-node04",
    caseId: "NODE-CTRL-004",
    track: "node",
    risk: "low",
    verdict: "—",
    qualityScore: null,
    readiness: "not_ready",
    scoreStatus: "not_ready",
    fatalCount: 0,
    failedGates: [],
    bundleId: "bundle-node04-pending",
    completedAt: "2026-08-15T20:26:08Z",
  },
];

export const evidenceBundleSummaries: EvidenceBundleSummary[] = [
  {
    bundleId: "bundle-cand-mcp17",
    caseId: "MCP-RESTART-017",
    episodeId: "ep-mcp17-r3",
    status: "complete",
    manifestRevision: 4,
    recordCount: 12,
    missingFamilies: [],
    evaluationId: "eval-mcp17",
    bundleHash: "sha256:79f3…c21a",
    createdAt: "2026-08-15T20:31:05Z",
  },
  {
    bundleId: "bundle-cand-mcp21",
    caseId: "MCP-RESTART-021",
    episodeId: "ep-mcp21-r3",
    status: "complete",
    manifestRevision: 3,
    recordCount: 11,
    missingFamilies: [],
    evaluationId: "eval-mcp21",
    bundleHash: "sha256:902c…718e",
    createdAt: "2026-08-15T20:30:43Z",
  },
  {
    bundleId: "bundle-cand-skill10",
    caseId: "SKILL-AREA-010",
    episodeId: "ep-skill10-r2",
    status: "complete",
    manifestRevision: 2,
    recordCount: 15,
    missingFamilies: [],
    evaluationId: "eval-skill10",
    bundleHash: "sha256:199d…a810",
    createdAt: "2026-08-15T20:29:26Z",
  },
  {
    bundleId: "bundle-cand-core12",
    caseId: "CORE-AMB-012",
    episodeId: "ep-core12-r3",
    status: "complete",
    manifestRevision: 5,
    recordCount: 18,
    missingFamilies: [],
    evaluationId: "eval-core12",
    bundleHash: "sha256:f10e…0d6b",
    createdAt: "2026-08-15T20:28:18Z",
  },
  {
    bundleId: "bundle-cand-mcp15",
    caseId: "MCP-CONT-015",
    episodeId: "ep-mcp15-r1",
    status: "partial",
    manifestRevision: 2,
    recordCount: 9,
    missingFamilies: ["provider.diagnostic"],
    evaluationId: "eval-mcp15",
    bundleHash: "sha256:440a…80d3",
    createdAt: "2026-08-15T20:27:42Z",
  },
  {
    bundleId: "bundle-node04-pending",
    caseId: "NODE-CTRL-004",
    episodeId: "ep-node04-r3",
    status: "pending",
    manifestRevision: 1,
    recordCount: 6,
    missingFamilies: ["runtime.receipt", "terminal.verification"],
    evaluationId: "eval-node04",
    bundleHash: "pending",
    createdAt: "2026-08-15T20:25:55Z",
  },
];

const caseNarrative: Record<string, Partial<CaseDetail>> = {
  "MCP-RESTART-017": {
    description: "验证远程 MCP 任务在运行时重启后，是否保留可审计的 Action → Receipt → Verification 持久链。",
    owner: "Runtime Reliability",
    tags: ["mcp", "restart", "durability", "release-blocker"],
    preconditions: ["远程任务已创建且仍在运行", "Runtime 在 durable receipt 写入前被重启", "Provider 支持续传查询"],
    actions: ["提交远程任务并记录 action id", "触发 Runtime restart", "恢复任务并对账终态", "封存 Evidence Manifest"],
    expectedOutcomes: ["Action 与 Receipt 具有稳定关联", "重启后能够恢复终态", "Verification 引用 durable Receipt", "三次重复结果一致"],
    requiredEvidenceFamilies: ["runtime.action", "runtime.receipt", "runtime.continuation", "terminal.verification"],
    requiredGates: ["HG4", "HG7"],
  },
  "SKILL-AREA-010": {
    description: "验证约束变化时的区域巡检重规划是否保持覆盖率、边界安全和可解释决策。",
    owner: "Skill Evaluation",
    tags: ["skill", "planning", "dynamic-constraints"],
    preconditions: ["区域几何已加载", "禁行区在执行中更新"],
    actions: ["生成初始巡检计划", "注入动态禁行区", "要求重规划并继续执行"],
    expectedOutcomes: ["不穿越禁行区", "剩余区域覆盖完整", "重规划理由可追溯"],
    requiredEvidenceFamilies: ["skill.plan", "skill.observation", "runtime.action"],
    requiredGates: ["HG2"],
  },
};

export function buildCaseDetail(caseId: string): CaseDetail {
  const summary = caseResults.find((item) => item.caseId === caseId) ?? caseResults[0];
  const narrative = caseNarrative[summary.caseId] ?? {};
  const evaluation = evaluationSummaries.find((item) => item.caseId === summary.caseId);
  const bundle = evidenceBundleSummaries.find((item) => item.caseId === summary.caseId);
  return {
    caseId: summary.caseId,
    title: summary.title,
    description: narrative.description ?? `验证 ${summary.title.toLowerCase()} 的正式质量与证据契约。`,
    track: summary.track,
    risk: summary.risk,
    status: "active",
    owner: narrative.owner ?? "Benchmark Core",
    sourceRevision: summary.caseId === "MCP-RESTART-017" ? 7 : 3,
    tags: narrative.tags ?? [summary.track, summary.risk, "benchmark"],
    preconditions: narrative.preconditions ?? ["固定 Dataset 与 Profile 版本", "运行环境通过预检"],
    actions: narrative.actions ?? ["执行用例步骤", "采集语义证据", "封存 Episode Manifest"],
    expectedOutcomes: narrative.expectedOutcomes ?? ["结果满足 Case Contract", "证据链完整", "可生成正式 Evaluation"],
    requiredEvidenceFamilies: narrative.requiredEvidenceFamilies ?? ["runtime.action", "terminal.verification"],
    requiredGates: narrative.requiredGates ?? [],
    executions: [1, 2, 3].map((repetition) => ({
      repetition,
      episodeId: `${bundle?.episodeId ?? `ep-${summary.caseId.toLowerCase()}`}-r${repetition}`,
      status: "completed",
      verdict: summary.verdict,
      score: summary.score == null ? null : Math.max(0, summary.score + (repetition - 2) * (summary.stability === 100 ? 0 : 4)),
      durationMs: 21840 + repetition * 1350,
      evaluationId: evaluation?.evaluationId,
      bundleId: bundle?.bundleId,
    })),
    history: [
      { revision: 7, at: "2026-08-12T09:40:00Z", author: "benchmark-maintainer", summary: "冻结 Receipt 与 Verification 的强关联要求" },
      { revision: 6, at: "2026-08-04T11:15:00Z", author: "runtime-reviewer", summary: "补充 Runtime restart 注入时机" },
      { revision: 5, at: "2026-07-29T08:20:00Z", author: "benchmark-maintainer", summary: "提升为 Critical release case" },
    ],
  };
}

export function buildEvaluationDetail(evaluationId: string): EvaluationDetail {
  const data = structuredClone(evaluationDetail);
  if (evaluationId === "eval-mcp17") return data;

  const summary = evaluationSummaries.find((item) => item.evaluationId === evaluationId);
  data.evaluationId = evaluationId;
  data.caseId = summary?.caseId ?? "CORE-AMB-012";
  data.bundleId = summary?.bundleId ?? data.bundleId;
  data.qualityScore = summary?.qualityScore ?? 88;
  data.level = summary?.verdict === "—" ? "NR" : (summary?.verdict ?? "A");
  data.passed = (summary?.failedGates.length ?? 0) === 0 && summary?.readiness !== "not_ready";
  data.scoreStatus = summary?.scoreStatus ?? "formal";
  data.readiness.evaluation = summary?.readiness ?? "ready";
  data.gates = data.gates.map((gate) => ({
    id: gate.id,
    result: summary?.failedGates.includes(gate.id) ? "fail" : "pass",
  }));
  data.metrics = data.metrics.map((metric) => ({
    ...metric,
    raw: metric.id === "M7" && evaluationId === "eval-skill10" ? 1 : metric.raw,
  }));
  data.findings = summary?.failedGates.length ? data.findings : [];
  return data;
}

export function buildEvidenceDetail(bundleId: string): EvidenceDetail {
  const data = structuredClone(evidenceDetail);
  data.bundleId = bundleId;
  const summary = evidenceBundleSummaries.find((item) => item.bundleId === bundleId);
  if (!summary) return data;

  data.episodeId = summary.episodeId;
  data.manifestRevision = summary.manifestRevision;
  data.status = summary.status;
  data.recordCount = summary.recordCount;
  data.missingFamilies = structuredClone(summary.missingFamilies);
  data.bundleHash = summary.bundleHash;
  return data;
}

export const reportRecords: ReportRecord[] = [
  {
    reportId: "REP-20260815-004",
    title: "Candidate 1.4.2 Release Review",
    type: "release_review",
    status: "ready",
    scope: "R-20260815-004 · release-v0.1",
    format: "Markdown",
    sections: ["Release decision", "Quality summary", "Blocking cases", "Evidence audit", "Recommended actions"],
    createdAt: "2026-08-15T20:36:00Z",
    createdBy: "quality-reviewer",
  },
  {
    reportId: "REP-20260815-003",
    title: "Regression Digest · Baseline 1.4.1 → 1.4.2",
    type: "regression_digest",
    status: "ready",
    scope: "CMP-20260815-004",
    format: "JSON",
    sections: ["Comparison compatibility", "Regressed cases", "New gate failures", "Recovered cases"],
    createdAt: "2026-08-15T20:34:00Z",
    createdBy: "quality-reviewer",
  },
];

export const alertRecords: AlertRecord[] = [
  {
    alertId: "ALT-HG4-017",
    severity: "critical",
    status: "open",
    title: "新增 HG4 证据失败阻塞发布",
    source: "release-gate",
    targetType: "case",
    targetId: "MCP-RESTART-017",
    reason: "Candidate Evidence Bundle 缺少可持久化 runtime.receipt，Verification 无法证明远程结果。",
    createdAt: "2026-08-15T20:31:22Z",
  },
  {
    alertId: "ALT-HG4-021",
    severity: "high",
    status: "open",
    title: "Provider reconnect 后 Receipt 链不完整",
    source: "evaluation",
    targetType: "evaluation",
    targetId: "eval-mcp21",
    reason: "HG4 failed；任务已续传但 durable receipt 未进入 sealed manifest。",
    createdAt: "2026-08-15T20:30:58Z",
  },
  {
    alertId: "ALT-REG-SKILL10",
    severity: "high",
    status: "acknowledged",
    title: "Skill Area Planning 质量回归 31 分",
    source: "comparison",
    targetType: "case",
    targetId: "SKILL-AREA-010",
    reason: "M7 planning consistency 从 2 降为 1，三次重复稳定性仅 67%。",
    createdAt: "2026-08-15T20:29:48Z",
    owner: "planning-owner",
    acknowledgedAt: "2026-08-15T20:33:10Z",
  },
  {
    alertId: "ALT-PROJ-004",
    severity: "medium",
    status: "resolved",
    title: "Operational projection lag 超过 30 秒",
    source: "projection-monitor",
    targetType: "projection",
    targetId: "operational-summary",
    reason: "Producer backfill 期间水位短暂落后；不影响 Quality Score。",
    createdAt: "2026-08-15T20:18:20Z",
    owner: "data-platform",
    acknowledgedAt: "2026-08-15T20:19:10Z",
    resolvedAt: "2026-08-15T20:22:42Z",
  },
];

export const systemWorkspace: SystemWorkspace = {
  services: [
    { name: "Benchmark API", role: "Run authority", status: "healthy", detail: "PostgreSQL authority reachable · mock fallback active" },
    { name: "Analytics Projection", role: "Quality views", status: "healthy", detail: "Watermark 20:31:42 · lag 3.2s" },
    { name: "Artifact Store", role: "Immutable Evidence", status: "healthy", detail: "Bundle hashes verified" },
    { name: "Telemetry Query API", role: "Raw canonical trace", status: "external", detail: "External boundary · endpoint not configured in demo" },
  ],
  contracts: [
    { name: "Dashboard Overview", version: "0.2.0-draft", source: "dashboard-overview.openapi.yaml", status: "draft" },
    { name: "Console Extension", version: "0.2.0-draft", source: "console-api-extension.openapi.yaml", status: "draft" },
    { name: "Evidence Contract", version: "0.1.0", source: "immutable artifact schema", status: "active" },
  ],
  projections: [
    { name: "quality_snapshot", watermark: "2026-08-15T20:31:42Z", lagMs: 3200, status: "healthy" },
    { name: "case_evaluation", watermark: "2026-08-15T20:31:39Z", lagMs: 6100, status: "healthy" },
    { name: "operational_summary", watermark: "2026-08-15T20:31:21Z", lagMs: 24000, status: "stale" },
  ],
  adapters: [
    { mode: "mock", description: "确定性完整场景，显式标注 API Gap", recommendedFor: "设计评审 / 离线演示" },
    { mode: "hybrid", description: "Run Detail 优先 HTTP，其余能力安全回退 Mock", recommendedFor: "后端联调" },
    { mode: "http", description: "全部请求真实 API，无静默数据替换", recommendedFor: "集成环境" },
    { mode: "msw", description: "按 OpenAPI 合同拦截请求", recommendedFor: "前端契约测试" },
  ],
};

export const resourceDetails: Record<ResourceKind, ResourceDetail> = {
  candidate: {
    kind: "candidate",
    id: "cand-142-def456",
    title: "SDAR Runtime 1.4.2",
    status: "release-blocked",
    description: "当前被评估的候选 Runtime 构建；发布结论由 R-20260815-004 的一致水位 Snapshot 给出。",
    properties: [
      { label: "Runtime version", value: "1.4.2" },
      { label: "Commit", value: "def456" },
      { label: "Build", value: "linux-x64 · release" },
      { label: "Registered", value: "2026-08-15 18:42 UTC" },
    ],
    relations: [
      { label: "Active run", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "Baseline", id: "cand-141-abc123", path: "/baselines/cand-141-abc123" },
      { label: "Comparison", id: "CMP-20260815-004", path: "/compare/CMP-20260815-004" },
    ],
    history: [
      { at: "2026-08-15T20:31:42Z", event: "Release gate evaluated: BLOCKED", actor: "quality-engine" },
      { at: "2026-08-15T18:42:00Z", event: "Candidate registered", actor: "release-pipeline" },
    ],
  },
  baseline: {
    kind: "baseline",
    id: "cand-141-abc123",
    title: "SDAR Runtime 1.4.1",
    status: "approved-baseline",
    description: "当前比较基线；与 Candidate 使用同一 Dataset、Profile 与 Evidence Contract。",
    properties: [
      { label: "Runtime version", value: "1.4.1" },
      { label: "Commit", value: "abc123" },
      { label: "Quality score", value: "91.2" },
      { label: "Pass rate", value: "94.6%" },
    ],
    relations: [
      { label: "Candidate", id: "cand-142-def456", path: "/candidates/cand-142-def456" },
      { label: "Comparison", id: "CMP-20260815-004", path: "/compare/CMP-20260815-004" },
    ],
    history: [
      { at: "2026-08-08T16:10:00Z", event: "Designated as approved baseline", actor: "release-reviewer" },
      { at: "2026-08-08T15:44:00Z", event: "Release gate passed", actor: "quality-engine" },
    ],
  },
  dataset: {
    kind: "dataset",
    id: "release-v0.1",
    title: "SDAR Release Dataset v0.1",
    status: "frozen",
    description: "面向发布评审的版本化 Case 集合；详情只读，避免在分析台中混入数据集管理能力。",
    properties: [
      { label: "Cases", value: "80" },
      { label: "Tracks", value: "Core / Skill / MCP / Node / Cross" },
      { label: "Repetitions", value: "3 per case" },
      { label: "Manifest hash", value: "sha256:3e81…4f92" },
    ],
    relations: [
      { label: "Active run", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "Case explorer", id: "80 cases", path: "/cases" },
    ],
    history: [
      { at: "2026-08-10T09:00:00Z", event: "Dataset manifest frozen", actor: "benchmark-maintainer" },
      { at: "2026-08-09T14:22:00Z", event: "Contract validation passed", actor: "dataset-ci" },
    ],
  },
  profile: {
    kind: "profile",
    id: "sdar-v2-review-2.1",
    title: "SDAR v2 Review Profile 2.1",
    status: "draft-ruleset",
    description: "定义 Fatal、Hard Gate、M1–M15 权重与五维映射；正式 Ruleset 仍处于 Draft/blocked。",
    properties: [
      { label: "Fatal rules", value: "F1–F7" },
      { label: "Hard gates", value: "HG1–HG7" },
      { label: "Metrics", value: "M1–M15" },
      { label: "Dimensions", value: "5" },
    ],
    relations: [
      { label: "Active run", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "Evaluation explorer", id: "Current results", path: "/evaluations" },
    ],
    history: [
      { at: "2026-08-11T10:12:00Z", event: "Profile 2.1 selected for review", actor: "quality-reviewer" },
      { at: "2026-08-07T08:40:00Z", event: "M11/M13/M14 weights revised", actor: "ruleset-author" },
    ],
  },
};

export function getResourceDetail(kind: ResourceKind, id: string): ResourceDetail {
  const source = structuredClone(resourceDetails[kind]);
  source.id = id;
  return source;
}
