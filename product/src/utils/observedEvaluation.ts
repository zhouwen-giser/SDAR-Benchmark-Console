import type { EvaluationFraction, ObservedEvaluation } from "../types";

/** Format exact integers without overflowing Number or altering the Server score. */
export function formatFraction(value: EvaluationFraction | null | undefined, decimals = 1, multiplier = 1): string {
  if (!value || !/^-?\d+$/.test(value.numerator) || !/^[1-9]\d*$/.test(value.denominator)) return "—";
  const numerator = BigInt(value.numerator) * BigInt(multiplier);
  const denominator = BigInt(value.denominator);
  const scale = 10n ** BigInt(decimals);
  const absolute = numerator < 0n ? -numerator : numerator;
  const rounded = (absolute * scale * 2n + denominator) / (2n * denominator);
  const digits = rounded.toString().padStart(decimals + 1, "0");
  const formatted = decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits;
  return `${numerator < 0n && rounded !== 0n ? "-" : ""}${formatted}`;
}

export function coverageText(value: EvaluationFraction | null | undefined): string {
  const formatted = formatFraction(value, 2, 100);
  return formatted === "—" ? formatted : `${formatted.replace(/\.?0+$/, "")}%`;
}

export function evaluationScoreText(status: ObservedEvaluation["scoreStatus"], score: EvaluationFraction | null, displayScore?: string | null): string {
  if (!["SCORED", "PARTIAL_SCORED"].includes(status)) return "—";
  if (displayScore == null) return formatFraction(score);
  // displayScore is a Server-rounded decimal string, not a second scoring rule.
  if (!/^-?\d+(\.\d+)?$/.test(displayScore)) return "—";
  const [whole, decimals = ""] = displayScore.split(".");
  return formatFraction({ numerator: `${whole}${decimals}`, denominator: (10n ** BigInt(decimals.length)).toString() });
}

export function observedScoreText(value: ObservedEvaluation): string {
  return evaluationScoreText(value.scoreStatus, value.observedScore, value.displayScore);
}

export const observedStatusLabels: Record<ObservedEvaluation["scoreStatus"], string> = {
  SCORED: "已评分", PARTIAL_SCORED: "部分评分", NO_DATA: "无可评分数据",
  NOT_APPLICABLE: "不适用", INVALID_INPUT: "输入无效",
};
export const limitationLabels: Record<string, string> = {
  PARTIAL_METRIC_COVERAGE: "部分指标缺少可评分数据",
  SOURCE_CONTENT_BINDINGS_INCOMPLETE: "部分数据尚未映射到评分项",
  SOURCE_APPROVAL_IS_SEPARATE: "普通评价不依赖正式来源批准",
  SCORE_DOES_NOT_ESTABLISH_TASK_SUCCESS: "当前分数不能单独证明任务成功",
};
