import { Empty, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DebugPayloadDrawer } from "./common";

type AnalyticsRecord = Record<string, unknown>;

const fieldsByModule: Record<string, string[]> = {
  candidates: ["candidateSnapshotId", "label", "runCount", "terminalRunCount", "substitutionRate", "lastRunAt", "dataClass"],
  tracks: ["track", "caseCount", "repetitionCount", "passCount", "failCount", "indeterminateCount", "dataClass"],
  "scenario-families": ["scenarioFamily", "track", "caseCount", "repetitionCount", "outcomeCounts", "dataClass"],
  risks: ["riskLevel", "caseCount", "repetitionCount", "failureCount", "dataClass"],
  skills: ["benchmarkRunId", "skillId", "skillVersion", "invocationCount", "terminalCount", "statusCounts", "durationStats", "caseCoverage", "trackCoverage", "sourceCompleteness", "dataClass", "formalEligible", "evaluatedAt", "projectedAt"],
  providers: ["benchmarkRunId", "providerId", "providerInstanceId", "operation", "taskCount", "executionCount", "missionCount", "closureStatus", "dataClass", "formalEligible", "evaluatedAt", "projectedAt"],
  "quality-trend": ["runId", "completedAt", "qualityScore", "scoreStatus", "diagnosticPassRate", "dataClass"],
  "change-summary": ["comparisonId", "baselineId", "candidateRunId", "changedCaseCount", "reasonCodes", "dataClass"],
  "track-risk-matrix": ["track", "riskLevel", "repetitionCount", "failedCount", "indeterminateCount", "dataClass"],
  metrics: ["metricId", "version", "value", "unit", "status", "evidenceCount", "dataClass"],
  dimensions: ["dimensionId", "value", "status", "metricCount", "dataClass"],
  "readiness-funnel": ["stage", "inputCount", "readyCount", "blockedCount", "reasonCodes", "dataClass"],
  stability: ["caseId", "repeatCount", "terminalRate", "outcomeConsistency", "durationVariance", "dataClass"],
  "regression-contributors": ["factor", "delta", "caseIds", "evidenceRefs", "dataClass"],
  "score-distribution": ["observationCount", "p10", "p25", "median", "p75", "p90", "availability", "reasonCodes", "dataClass", "formalEligible"],
  operational: ["metricKey", "unit", "current", "baseline", "delta", "sampleCount", "dataClass", "formalEligible"],
  gates: ["gateId", "version", "status", "count", "evidenceRefs", "dataClass"],
  fatals: ["fatalId", "version", "status", "count", "evidenceRefs", "dataClass"],
};

const labels: Record<string, string> = {
  candidateSnapshotId: "Candidate",
  terminalRunCount: "Terminal Runs",
  scenarioFamily: "Scenario Family",
  riskLevel: "Risk",
  repetitionCount: "Repetitions",
  invocationCount: "Invocations",
  terminalCount: "Terminal",
  providerInstanceId: "Provider Instance",
  diagnosticPassRate: "Diagnostic Pass Rate",
  changedCaseCount: "Changed Cases",
  metricId: "Metric",
  dimensionId: "Dimension",
  inputCount: "Input",
  readyCount: "Ready",
  blockedCount: "Blocked",
  outcomeConsistency: "Consistency",
  durationVariance: "Duration Variance",
  observationCount: "Observations",
  sampleCount: "Samples",
  dataClass: "Data Class",
  reasonCodes: "Reasons",
  evidenceRefs: "Evidence",
};

export function TypedAnalyticsModule({ moduleKey, rows }: { moduleKey: string; rows: unknown[] }) {
  const records = rows.filter(isRecord);
  if (records.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无可用 observation" />;
  const fields = fieldsByModule[moduleKey] ?? Object.keys(records[0] ?? {}).slice(0, 8);
  const columns: ColumnsType<AnalyticsRecord> = fields.map((field) => ({
    title: labels[field] ?? humanize(field),
    dataIndex: field,
    key: field,
    render: (value: unknown) => <AnalyticsValue field={field} value={value} />,
  }));
  return <>
    <div className="typed-analytics-toolbar">
      <span>{records.length} observations</span>
      <DebugPayloadDrawer payload={rows} />
    </div>
    <Table<AnalyticsRecord>
      className="typed-analytics-table"
      rowKey={rowKey}
      size="small"
      pagination={records.length > 8 ? { pageSize: 8 } : false}
      dataSource={records}
      columns={columns}
      scroll={{ x: "max-content" }}
    />
  </>;
}

function AnalyticsValue({ field, value }: { field: string; value: unknown }) {
  if (value == null) return <span>—</span>;
  if (field === "dataClass") return <DataClassTag value={String(value)} />;
  if (field === "availability" || field === "status" || field === "closureStatus" || field === "scoreStatus") return <Tag color={statusColor(String(value))}>{String(value)}</Tag>;
  if (typeof value === "number") return <span>{Number.isInteger(value) ? value : value.toFixed(3)}</span>;
  if (typeof value === "boolean") return <Tag color={value ? "green" : "red"}>{String(value)}</Tag>;
  if (typeof value === "string") return field.endsWith("Id") || field.endsWith("Ref") ? <code>{value}</code> : <span>{value}</span>;
  if (Array.isArray(value)) return <div className="typed-cell-list">{value.length === 0 ? "—" : value.slice(0, 6).map((item, index) => <Tag key={`${String(item)}-${index}`}>{compactValue(item)}</Tag>)}</div>;
  if (isRecord(value)) return <div className="typed-cell-list">{Object.entries(value).slice(0, 6).map(([key, item]) => <Tag key={key}>{key}: {compactValue(item)}</Tag>)}</div>;
  return <span>{String(value)}</span>;
}

export function DataClassTag({ value }: { value: string }) {
  const color = value === "formal" ? "green" : value === "development_native" ? "blue" : value === "development_substituted" ? "gold" : value === "development_fixture" ? "purple" : "default";
  return <Tag color={color}>{value}</Tag>;
}

function isRecord(value: unknown): value is AnalyticsRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compactValue(value: unknown) {
  if (value == null) return "—";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return "typed object";
}

function rowKey(row: AnalyticsRecord) {
  const identity = row.runId ?? row.caseId ?? row.candidateSnapshotId ?? row.skillId ?? row.providerId ?? row.metricId ?? row.dimensionId ?? row.gateId ?? row.fatalId ?? row.stage;
  if (identity != null) return String(identity);
  return Object.entries(row).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 4).map(([key, value]) => `${key}:${String(value)}`).join("|") || "analytics-row";
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function statusColor(value: string) {
  const normalized = value.toLowerCase();
  if (["available", "passed", "complete", "closed", "formal"].includes(normalized)) return "green";
  if (["failed", "unavailable", "open", "blocked"].includes(normalized)) return "red";
  return "gold";
}
