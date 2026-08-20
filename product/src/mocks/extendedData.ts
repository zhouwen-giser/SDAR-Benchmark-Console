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
    description: "验证远程 MCP 任务在运行时重启后，是否保留可审计的“动作 → 回执 → 验证”持久链。",
    owner: "运行时可靠性团队",
    tags: ["MCP 协议", "重启恢复", "持久性", "发布阻塞项"],
    preconditions: ["远程任务已创建且仍在运行", "运行时在持久化回执写入前被重启", "服务提供方支持续传查询"],
    actions: ["提交远程任务并记录动作编号", "触发运行时重启", "恢复任务并对账终态", "封存证据清单"],
    expectedOutcomes: ["动作与回执具有稳定关联", "重启后能够恢复终态", "验证记录引用持久化回执", "三次重复结果一致"],
    requiredEvidenceFamilies: ["runtime.action", "runtime.receipt", "runtime.continuation", "terminal.verification"],
    requiredGates: ["HG4", "HG7"],
  },
  "SKILL-AREA-010": {
    description: "验证约束变化时的区域巡检重规划是否保持覆盖率、边界安全和可解释决策。",
    owner: "技能评价团队",
    tags: ["技能", "规划", "动态约束"],
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
    description: narrative.description ?? `验证“${summary.title}”的正式质量与证据合同。`,
    track: summary.track,
    risk: summary.risk,
    status: "active",
    owner: narrative.owner ?? "基准评测核心团队",
    sourceRevision: summary.caseId === "MCP-RESTART-017" ? 7 : 3,
    tags: narrative.tags ?? [summary.track, summary.risk, "基准评测"],
    preconditions: narrative.preconditions ?? ["固定数据集与评价配置版本", "运行环境通过预检"],
    actions: narrative.actions ?? ["执行用例步骤", "采集语义证据", "封存执行过程证据清单"],
    expectedOutcomes: narrative.expectedOutcomes ?? ["结果满足用例合同", "证据链完整", "可生成正式评价结果"],
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
      { revision: 7, at: "2026-08-12T09:40:00Z", author: "benchmark-maintainer", summary: "冻结回执与验证记录的强关联要求" },
      { revision: 6, at: "2026-08-04T11:15:00Z", author: "runtime-reviewer", summary: "补充运行时重启注入时机" },
      { revision: 5, at: "2026-07-29T08:20:00Z", author: "benchmark-maintainer", summary: "提升为极高风险发布用例" },
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
    title: "候选版本 1.4.2 发布评审",
    type: "release_review",
    status: "ready",
    scope: "R-20260815-004 · release-v0.1",
    format: "Markdown",
    sections: ["发布结论", "质量摘要", "阻塞用例", "证据审计", "建议措施"],
    createdAt: "2026-08-15T20:36:00Z",
    createdBy: "quality-reviewer",
  },
  {
    reportId: "REP-20260815-003",
    title: "回归摘要 · 基准版本 1.4.1 → 候选版本 1.4.2",
    type: "regression_digest",
    status: "ready",
    scope: "CMP-20260815-004",
    format: "JSON",
    sections: ["比较兼容性", "回归用例", "新增硬门槛失败", "已恢复用例"],
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
    reason: "候选版本证据包缺少可持久化运行时回执（runtime.receipt），结果验证记录无法证明远程任务结果。",
    createdAt: "2026-08-15T20:31:22Z",
  },
  {
    alertId: "ALT-HG4-021",
    severity: "high",
    status: "open",
    title: "服务提供方重连后回执链不完整",
    source: "evaluation",
    targetType: "evaluation",
    targetId: "eval-mcp21",
    reason: "HG4 硬门槛失败；任务已续传，但持久化回执没有进入已封存的证据清单。",
    createdAt: "2026-08-15T20:30:58Z",
  },
  {
    alertId: "ALT-REG-SKILL10",
    severity: "high",
    status: "acknowledged",
    title: "技能区域规划质量回归 31 分",
    source: "comparison",
    targetType: "case",
    targetId: "SKILL-AREA-010",
    reason: "M7 规划一致性从 2 降为 1，三次重复执行的稳定性仅为 67%。",
    createdAt: "2026-08-15T20:29:48Z",
    owner: "planning-owner",
    acknowledgedAt: "2026-08-15T20:33:10Z",
  },
  {
    alertId: "ALT-PROJ-004",
    severity: "medium",
    status: "resolved",
    title: "运行指标投影延迟超过 30 秒",
    source: "projection-monitor",
    targetType: "projection",
    targetId: "operational-summary",
    reason: "数据生产方回填期间水位短暂落后；不影响质量得分。",
    createdAt: "2026-08-15T20:18:20Z",
    owner: "data-platform",
    acknowledgedAt: "2026-08-15T20:19:10Z",
    resolvedAt: "2026-08-15T20:22:42Z",
  },
];

export const systemWorkspace: SystemWorkspace = {
  services: [
    { name: "基准评测接口", role: "评测运行权威数据", status: "healthy", detail: "PostgreSQL 权威数据可访问，演示数据回退已启用" },
    { name: "指标分析投影", role: "质量分析视图", status: "healthy", detail: "数据水位 20:31:42，延迟 3.2 秒" },
    { name: "制品存储服务", role: "不可变证据存储", status: "healthy", detail: "证据包哈希已验证" },
    { name: "遥测查询接口", role: "原始权威追踪记录", status: "external", detail: "属于外部边界，演示环境未配置服务地址" },
  ],
  contracts: [
    { name: "总览看板合同", version: "0.2.0-draft", source: "dashboard-overview.openapi.yaml", status: "draft" },
    { name: "控制台扩展合同", version: "0.2.0-draft", source: "console-api-extension.openapi.yaml", status: "draft" },
    { name: "证据合同", version: "0.1.0", source: "immutable-artifact-schema（不可变制品结构）", status: "active" },
  ],
  projections: [
    { name: "质量快照（quality_snapshot）", watermark: "2026-08-15T20:31:42Z", lagMs: 3200, status: "healthy" },
    { name: "用例评价（case_evaluation）", watermark: "2026-08-15T20:31:39Z", lagMs: 6100, status: "healthy" },
    { name: "运行指标摘要（operational_summary）", watermark: "2026-08-15T20:31:21Z", lagMs: 24000, status: "stale" },
  ],
  adapters: [
    { mode: "mock", description: "确定性完整场景，显式标注接口缺口", recommendedFor: "设计评审 / 离线演示" },
    { mode: "hybrid", description: "评测运行详情优先使用 HTTP 接口，其余能力安全回退演示数据", recommendedFor: "后端联调" },
    { mode: "http", description: "全部请求使用真实接口，不进行静默数据替换", recommendedFor: "集成环境" },
    { mode: "msw", description: "按 OpenAPI 合同拦截并模拟请求", recommendedFor: "前端合同测试" },
  ],
};

export const resourceDetails: Record<ResourceKind, ResourceDetail> = {
  candidate: {
    kind: "candidate",
    id: "cand-142-def456",
    title: "SDAR 运行时 1.4.2",
    status: "release-blocked",
    description: "当前被评估的候选运行时构建；发布结论由 R-20260815-004 的一致水位数据快照给出。",
    properties: [
      { label: "运行时版本", value: "1.4.2" },
      { label: "提交版本", value: "def456" },
      { label: "构建目标", value: "linux-x64 · 发布构建" },
      { label: "注册时间", value: "2026-08-15 18:42（协调世界时）" },
    ],
    relations: [
      { label: "当前评测运行", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "基准版本", id: "cand-141-abc123", path: "/baselines/cand-141-abc123" },
      { label: "版本比较", id: "CMP-20260815-004", path: "/compare/CMP-20260815-004" },
    ],
    history: [
      { at: "2026-08-15T20:31:42Z", event: "发布门槛评价结果：已阻塞", actor: "quality-engine" },
      { at: "2026-08-15T18:42:00Z", event: "候选版本已注册", actor: "release-pipeline" },
    ],
  },
  baseline: {
    kind: "baseline",
    id: "cand-141-abc123",
    title: "SDAR 运行时 1.4.1",
    status: "approved-baseline",
    description: "当前比较基准；与候选版本使用同一数据集、评价配置与证据合同。",
    properties: [
      { label: "运行时版本", value: "1.4.1" },
      { label: "提交版本", value: "abc123" },
      { label: "质量得分", value: "91.2" },
      { label: "通过率", value: "94.6%" },
    ],
    relations: [
      { label: "候选版本", id: "cand-142-def456", path: "/candidates/cand-142-def456" },
      { label: "版本比较", id: "CMP-20260815-004", path: "/compare/CMP-20260815-004" },
    ],
    history: [
      { at: "2026-08-08T16:10:00Z", event: "指定为已批准基准版本", actor: "release-reviewer" },
      { at: "2026-08-08T15:44:00Z", event: "发布门槛已通过", actor: "quality-engine" },
    ],
  },
  dataset: {
    kind: "dataset",
    id: "release-v0.1",
    title: "SDAR 发布评审数据集 v0.1",
    status: "frozen",
    description: "面向发布评审的版本化测试用例集合；详情只读，避免在分析台中混入数据集管理能力。",
    properties: [
      { label: "测试用例数", value: "80" },
      { label: "分轨", value: "核心 / 技能 / MCP 协议 / 节点控制 / 跨域" },
      { label: "重复执行", value: "每个用例 3 次" },
      { label: "清单哈希", value: "sha256:3e81…4f92" },
    ],
    relations: [
      { label: "当前评测运行", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "用例浏览器", id: "80 个用例", path: "/cases" },
    ],
    history: [
      { at: "2026-08-10T09:00:00Z", event: "数据集清单已冻结", actor: "benchmark-maintainer" },
      { at: "2026-08-09T14:22:00Z", event: "合同验证已通过", actor: "dataset-ci" },
    ],
  },
  profile: {
    kind: "profile",
    id: "sdar-v2-review-2.1",
    title: "SDAR v2 评审配置 2.1",
    status: "draft-ruleset",
    description: "定义致命规则、硬门槛、M1–M15 权重与五维映射；正式规则集仍处于草稿和阻塞状态。",
    properties: [
      { label: "致命规则", value: "F1–F7" },
      { label: "硬门槛", value: "HG1–HG7" },
      { label: "评价指标", value: "M1–M15" },
      { label: "能力维度", value: "5" },
    ],
    relations: [
      { label: "当前评测运行", id: "R-20260815-004", path: "/runs/R-20260815-004" },
      { label: "评价结果浏览器", id: "当前结果", path: "/evaluations" },
    ],
    history: [
      { at: "2026-08-11T10:12:00Z", event: "评审选用评价配置 2.1", actor: "quality-reviewer" },
      { at: "2026-08-07T08:40:00Z", event: "修订 M11/M13/M14 指标权重", actor: "ruleset-author" },
    ],
  },
};

export function getResourceDetail(kind: ResourceKind, id: string): ResourceDetail {
  const source = structuredClone(resourceDetails[kind]);
  source.id = id;
  return source;
}
