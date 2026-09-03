import { Statistic, Table, Tag } from "antd";
import type { DiagnosticOutcomeDistributionRow } from "../api/generated/model";

export function DiagnosticOutcomeDistributionPanel({ rows }: { rows: DiagnosticOutcomeDistributionRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const substituted = rows.reduce((sum, row) => sum + row.substitutedCount, 0);
  const fixture = rows.reduce((sum, row) => sum + row.fixtureCount, 0);
  return <div className="diagnostic-outcome-panel">
    <div className="diagnostic-outcome-grid">
      <Statistic title="Observations" value={total} />
      <Statistic title="Substituted" value={substituted} valueStyle={{ color: "#d89614" }} />
      <Statistic title="Fixture" value={fixture} valueStyle={{ color: "#9254de" }} />
    </div>
    <Table<DiagnosticOutcomeDistributionRow> rowKey="outcome" size="small" pagination={false} dataSource={rows} columns={[
      { title: "Outcome", dataIndex: "outcome", render: (value: string) => <Tag>{value}</Tag> },
      { title: "Count", dataIndex: "count" },
      { title: "Substituted", dataIndex: "substitutedCount" },
      { title: "Fixture", dataIndex: "fixtureCount" },
      { title: "Formal Eligible", dataIndex: "formalEligible", render: (value: unknown) => <Tag color={value === true ? "green" : "red"}>{String(value)}</Tag> },
      { title: "Last Observed", dataIndex: "lastObservedAt", render: (value: string) => <code>{value}</code> },
    ]} />
  </div>;
}
