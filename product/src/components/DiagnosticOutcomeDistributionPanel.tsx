import { Descriptions, Progress, Statistic, Tag } from "antd";
import { DataClassTag } from "./TypedAnalyticsModule";

export interface DiagnosticOutcomeDistributionView {
  schemaVersion: "sdar-benchmark.diagnostic-outcome-distribution/v1";
  dataClass: "development_native" | "development_substituted" | "development_fixture";
  total: number;
  passed: number;
  failed: number;
  indeterminate: number;
  cancelled: number;
  completedWithSubstitutions: number;
  groupBy?: "run" | "case" | "track" | "candidate";
  watermark?: string | null;
}

export function DiagnosticOutcomeDistributionPanel({ value }: { value: DiagnosticOutcomeDistributionView }) {
  const terminal = value.passed + value.failed + value.indeterminate + value.cancelled;
  const terminalPercent = value.total === 0 ? 0 : Math.round((terminal / value.total) * 100);
  const items = [
    ["Passed", value.passed, "#52c41a"],
    ["Failed", value.failed, "#ff4d4f"],
    ["Indeterminate", value.indeterminate, "#faad14"],
    ["Cancelled", value.cancelled, "#8c8c8c"],
    ["With substitutions", value.completedWithSubstitutions, "#d89614"],
  ] as const;
  return <div className="diagnostic-outcome-panel">
    <Descriptions size="small" column={3} items={[
      { key: "class", label: "Data Class", children: <DataClassTag value={value.dataClass} /> },
      { key: "group", label: "Group By", children: <Tag>{value.groupBy ?? "all"}</Tag> },
      { key: "watermark", label: "Watermark", children: value.watermark ? <code>{value.watermark}</code> : "—" },
    ]} />
    <div className="diagnostic-outcome-grid">
      <div className="diagnostic-outcome-total"><Progress type="dashboard" percent={terminalPercent} format={() => `${terminal}/${value.total}`} /><small>Terminal / Total</small></div>
      {items.map(([label, count, color]) => <Statistic key={label} title={label} value={count} valueStyle={{ color }} />)}
    </div>
  </div>;
}
