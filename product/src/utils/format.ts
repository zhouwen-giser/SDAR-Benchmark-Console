export function displayValue(
  value: number | string | null | undefined,
  suffix = "",
): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

export function signedDelta(value: number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

export function compactTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function metricName(value: string): string {
  const names: Record<string, string> = {
    wallClockP50: "总耗时中位数（P50）",
    timeToFirstAction: "首次动作耗时",
    llmCalls: "大模型调用次数",
    mcpRetry: "MCP 重试次数",
    recoveryLatency: "恢复耗时",
  };
  return names[value] ?? value;
}

export function trackName(value: string): string {
  const names: Record<string, string> = {
    all: "全部分轨",
    core: "核心",
    Core: "核心",
    skill: "技能",
    Skill: "技能",
    mcp: "MCP 协议",
    MCP: "MCP 协议",
    node: "节点控制",
    Node: "节点控制",
    cross: "跨域",
    Cross: "跨域",
  };
  return names[value] ?? value;
}

export function riskName(value: string): string {
  const names: Record<string, string> = {
    all: "全部风险",
    critical: "极高",
    high: "高",
    medium: "中",
    low: "低",
  };
  return names[value] ?? value;
}

export function releaseStatusName(value: string): string {
  const names: Record<string, string> = {
    blocked: "已阻塞",
    ready: "可发布",
    invalid: "不可判定",
    warning: "需关注",
  };
  return names[value] ?? value;
}

export function dataStateName(value: string): string {
  const names: Record<string, string> = {
    loaded: "数据已就绪",
    loading: "数据加载中",
    empty: "暂无数据",
    error: "加载失败",
    stale: "数据已过期",
    partial: "数据不完整",
  };
  return names[value] ?? value;
}

export function changeName(value: string): string {
  const names: Record<string, string> = {
    all: "全部变化",
    fatal: "致命问题",
    ALL: "全部变化",
    NEW_FATAL: "新增致命问题",
    NONE: "无变化",
    UNCHANGED: "无变化",
    RECOVERED: "已恢复",
    IMPROVED: "已有改善",
    REGRESSED: "发生回归",
    NEW_GATE_FAILURE: "新增硬门槛失败",
    REGRESSED_AND_NEW_GATE: "回归或新增硬门槛失败",
    NOT_READY: "未就绪",
    not_ready: "未就绪",
  };
  return names[value] ?? value;
}

export function systemComponentName(value: string): string {
  const names: Record<string, string> = {
    "Evidence Ingestion": "证据接入服务",
    "Domain Projection": "领域数据投影",
    "Benchmark Evaluation": "基准评价服务",
    "Mart Projection": "指标数据投影",
    "Contract Release": "合同发布服务",
    "ClickHouse Schema": "ClickHouse 数据结构",
  };
  return names[value] ?? value;
}

export function statusName(value: string): string {
  const names: Record<string, string> = {
    healthy: "正常",
    degraded: "性能下降",
    external: "外部服务",
    lagging: "存在延迟",
    stale: "数据已过期",
    completed: "已完成",
    failed: "失败",
    pending: "等待中",
    active: "生效中",
    draft: "草稿",
    retired: "已停用",
    complete: "完整",
    partial: "不完整",
    normal: "正常",
    warning: "需关注",
    open: "待处理",
    acknowledged: "已确认",
    resolved: "已解决",
    investigating: "分析中",
    observing: "观察中",
    ready: "已就绪",
    not_ready: "未就绪",
    formal: "正式结果",
    diagnostic: "诊断结果",
    approved: "已批准",
    blocked: "已阻塞",
    invalid: "不可判定",
  };
  return names[value] ?? value;
}

export function severityName(value: string): string {
  const names: Record<string, string> = {
    critical: "极高",
    high: "高",
    medium: "中",
    low: "低",
  };
  return names[value] ?? value;
}

export function verdictName(value: string): string {
  const names: Record<string, string> = {
    HG: "硬门槛失败（HG）",
    NR: "未就绪（NR）",
    A: "优秀（A）",
    B: "良好（B）",
    C: "待改进（C）",
    D: "较差（D）",
    E: "不合格（E）",
    "—": "未形成结论",
  };
  return names[value] ?? value;
}

export function failureTypeName(value: string): string {
  const names: Record<string, string> = {
    NONE: "无失败",
    EVIDENCE_FAILURE: "证据失败",
    AGENT_FAILURE: "智能体执行失败",
    SYSTEM_FAILURE: "系统失败",
  };
  return names[value] ?? value;
}

export function readinessName(value: string): string {
  const names: Record<string, string> = {
    ready: "已就绪",
    not_ready: "未就绪",
    complete: "完整",
    partial: "不完整",
    pending: "等待中",
  };
  return names[value] ?? value;
}

export function scoreStatusName(value: string): string {
  const names: Record<string, string> = {
    formal: "正式评分",
    diagnostic: "诊断评分",
    not_ready: "未就绪",
  };
  return names[value] ?? value;
}

export function gateResultName(value: string): string {
  const names: Record<string, string> = {
    pass: "通过",
    fail: "失败",
    insufficient_evidence: "证据不足",
  };
  return names[value] ?? value;
}

export function evidenceLevelName(value: string): string {
  const names: Record<string, string> = {
    E0: "E0（无证据）",
    E1: "E1（基础证据）",
    E2: "E2（可验证证据）",
    E3: "E3（强证据）",
  };
  return names[value] ?? value;
}

export function evidenceFamilyName(value: string): string {
  const names: Record<string, string> = {
    runtime: "运行时证据",
    skill: "技能证据",
    mcp_task: "MCP 任务证据",
    evidence: "评价证据",
    "runtime.request": "运行时请求（runtime.request）",
    "runtime.goal": "运行时目标（runtime.goal）",
    "runtime.plan": "运行时计划（runtime.plan）",
    "runtime.action": "运行时动作（runtime.action）",
    "runtime.receipt": "运行时回执（runtime.receipt）",
    "runtime.continuation": "运行时续传（runtime.continuation）",
    "runtime.verification": "终态验证（runtime.verification）",
    "runtime.outcome": "运行结果（runtime.outcome）",
    "terminal.verification": "终态验证（terminal.verification）",
    "skill.plan": "技能计划（skill.plan）",
    "skill.observation": "技能观测（skill.observation）",
    "skill.selection": "技能选择（skill.selection）",
    "mcp_task.remote_binding": "远程任务绑定（mcp_task.remote_binding）",
    "mcp_task.control_event": "任务控制事件（mcp_task.control_event）",
    "mcp_task.continuation_attempt": "任务续传尝试（mcp_task.continuation_attempt）",
    "provider.diagnostic": "服务提供方诊断（provider.diagnostic）",
  };
  return names[value] ?? value;
}

export function evidenceLabelName(value: string): string {
  const names: Record<string, string> = {
    Request: "请求",
    Goal: "目标",
    "Skill Selection": "技能选择",
    Plan: "计划",
    Action: "动作",
    "Remote Task Binding": "远程任务绑定",
    "Control Event": "控制事件",
    Continuation: "任务续传",
    Verification: "结果验证",
    Outcome: "运行结果",
    Receipt: "执行回执",
    "Receipt (missing)": "执行回执（缺失）",
  };
  return names[value] ?? value;
}

export function dimensionName(value: string): string {
  const names: Record<string, string> = {
    "Goal & State": "目标与状态",
    Planning: "规划能力",
    "Decision & Safety": "决策与安全",
    "Execution & Evidence": "执行与证据",
    Closure: "闭环能力",
  };
  return names[value] ?? value;
}

export function targetTypeName(value: string): string {
  const names: Record<string, string> = {
    case: "测试用例",
    run: "评测运行",
    evaluation: "评价结果",
    projection: "数据投影",
  };
  return names[value] ?? value;
}

export function sourceName(value: string): string {
  const names: Record<string, string> = {
    "release-gate": "发布门槛",
    evaluation: "评价服务",
    comparison: "版本比较",
    "projection-monitor": "投影监控",
    benchmark: "基准评测",
  };
  return names[value] ?? value;
}

export function actorName(value: string | undefined): string {
  if (!value) return "未分配";
  const names: Record<string, string> = {
    "current-session": "当前会话",
    "quality-reviewer": "质量评审员",
    "quality-engine": "质量评价引擎",
    "release-pipeline": "发布流水线",
    "release-reviewer": "发布评审员",
    "benchmark-maintainer": "基准维护员",
    "runtime-reviewer": "运行时评审员",
    "planning-owner": "规划能力负责人",
    "data-platform": "数据平台团队",
    "dataset-ci": "数据集持续集成",
    "ruleset-author": "规则集维护员",
  };
  return names[value] ?? value;
}

export function resourceStatusName(value: string): string {
  const names: Record<string, string> = {
    "release-blocked": "发布已阻塞",
    "approved-baseline": "已批准基准",
    frozen: "已冻结",
    "draft-ruleset": "规则集草稿",
  };
  return names[value] ?? statusName(value);
}

export function reportTypeName(value: string): string {
  const names: Record<string, string> = {
    release_review: "发布评审",
    regression_digest: "回归摘要",
    evidence_audit: "证据审计",
  };
  return names[value] ?? value;
}

export function reportSectionName(value: string): string {
  const names: Record<string, string> = {
    "Release decision": "发布结论",
    "Quality summary": "质量摘要",
    "Blocking cases": "阻塞用例",
    "Evidence audit": "证据审计",
    "Recommended actions": "建议措施",
    "Comparison compatibility": "比较兼容性",
    "Regressed cases": "回归用例",
    "New gate failures": "新增硬门槛失败",
    "Recovered cases": "已恢复用例",
  };
  return names[value] ?? value;
}

export function adapterName(value: string): string {
  const names: Record<string, string> = {
    mock: "演示数据模式（Mock）",
    hybrid: "混合模式（Hybrid）",
    http: "真实接口模式（HTTP）",
    msw: "合同模拟模式（MSW）",
  };
  return names[value] ?? value;
}

export function metricValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "—";
  const units: Record<string, string> = { s: " 秒", count: " 次", ms: " 毫秒" };
  return `${value}${units[unit] ?? unit}`;
}

export function overviewText(value: string): string {
  const exact: Record<string, string> = {
    "MCP restart": "MCP 重启恢复",
    "embodied.area_patrol": "区域巡检技能",
    "verification missing": "验证证据缺失",
    "provider timeout": "服务提供方超时",
    "node config drift": "节点配置漂移",
    others: "其他",
    "NEW HG4 — MCP-RESTART-017": "新增 HG4 失败 — MCP-RESTART-017",
    "NR — missing runtime.verification": "未就绪 — 缺少运行时验证证据",
    "Projection lag reached 18s": "数据投影延迟达到 18 秒",
    "Projection Lag": "数据投影延迟",
    "Formal Evaluation Coverage": "正式评价覆盖率",
    "Not Ready 增加": "未就绪用例增加",
    "新 HG4 失败": "新增 HG4 硬门槛失败",
    "高风险 Case 失败": "高风险用例失败",
    "新增 2 个 HG4 失败": "新增 2 个 HG4 硬门槛失败",
    "3 个 NR 缺少 Verification": "3 个未就绪用例缺少验证证据",
    "2 New Required Hard Gate Failures": "新增 2 个必需硬门槛失败",
    "1 Critical-risk Case Failed": "1 个极高风险用例失败",
    "Formal evaluation coverage is insufficient": "正式评价覆盖率不足",
    "Projection lag exceeds freshness threshold": "数据投影延迟超过新鲜度阈值",
    "7 个 Case 受影响，主要原因是 Receipt 不完整": "7 个用例受到影响，主要原因是回执证据不完整",
    "2 个 MCP Case 在 Action 后缺失完整 Receipt": "2 个 MCP 用例在执行动作后缺失完整回执证据",
    "缺失类型集中在 runtime.verification": "缺失类型集中在运行时验证字段（runtime.verification）",
    "Node Control Track 明显改善": "节点控制分轨明显改善",
    "平均分提升 8.6%，未新增 Fatal/HG": "平均分提升 8.6%，未新增致命问题或硬门槛失败",
    "Critical-risk Case 通过率达到 100%": "极高风险用例通过率达到 100%",
    "仅 31% Case 完成正式评价，Mart Projection 延迟 180 秒": "仅 31% 的用例完成正式评价，指标数据投影延迟 180 秒",
    formalEvaluation: "正式评价",
    martProjection: "指标数据投影",
    scoreDistribution: "得分分布",
    operationalSummary: "运行指标摘要",
    "The latest refresh failed; previous snapshot retained.": "最新刷新失败，已保留上一次数据快照。",
    "Percentile algorithm release unavailable.": "分位数算法尚未发布。",
    "Provider samples are incomplete.": "服务提供方样本不完整。",
  };
  return exact[value] ?? value;
}
