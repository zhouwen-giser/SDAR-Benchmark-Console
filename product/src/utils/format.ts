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
    wallClockP50: "Wall Clock P50",
    timeToFirstAction: "Time to First Action",
    llmCalls: "LLM Calls",
    mcpRetry: "MCP Retry",
    recoveryLatency: "Recovery Latency",
  };
  return names[value] ?? value;
}
