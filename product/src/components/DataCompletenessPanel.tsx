import { Progress, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DataCompletenessSectionView, DataCompletenessView } from "../types";
import { SectionCard } from "./common";

const sectionLabels: Record<string, string> = {
  registry: "Registry",
  run: "Run Authority",
  projection: "Analytics Projection",
  identity: "Identity",
  artifact: "Artifact",
  formal: "Formalization",
};

const statusColors = { complete: "green", partial: "gold", unavailable: "red" } as const;

export function DataCompletenessPanel({ value }: { value: DataCompletenessView }) {
  const expected = value.sections.reduce((total, section) => total + section.expectedCount, 0);
  const available = value.sections.reduce((total, section) => total + section.availableCount, 0);
  const percent = expected === 0 ? 0 : Math.round((available / expected) * 100);
  const columns: ColumnsType<DataCompletenessSectionView> = [
    { title: "数据层", dataIndex: "sectionId", key: "sectionId", render: (sectionId: string) => <b>{sectionLabels[sectionId] ?? sectionId}</b> },
    { title: "状态", dataIndex: "status", key: "status", render: (status: DataCompletenessSectionView["status"]) => <Tag color={statusColors[status]}>{status}</Tag> },
    { title: "覆盖", key: "coverage", render: (_, row) => <Progress size="small" percent={row.expectedCount === 0 ? 0 : Math.round((row.availableCount / row.expectedCount) * 100)} format={() => `${row.availableCount}/${row.expectedCount}`} status={row.status === "unavailable" ? "exception" : "normal"} /> },
    { title: "原因码", dataIndex: "reasonCodes", key: "reasonCodes", render: (codes: string[]) => codes.length ? <div className="typed-cell-list">{codes.map((code) => <Tag key={code}>{code}</Tag>)}</div> : "—" },
    { title: "Watermark", dataIndex: "watermark", key: "watermark", render: (watermark?: string | null) => watermark ? <code>{watermark}</code> : "—" },
  ];

  return <>
    <div className="completeness-summary-grid">
      <SectionCard><Statistic title="Overall" value={value.overallStatus} valueStyle={{ color: value.overallStatus === "complete" ? "#52c41a" : "#faad14" }} /></SectionCard>
      <SectionCard><Statistic title="Available records" value={available} suffix={`/ ${expected}`} /></SectionCard>
      <SectionCard><Progress type="dashboard" percent={percent} size={92} /></SectionCard>
    </div>
    <SectionCard title="Registry / Run / Projection / Identity / Artifact / Formal coverage" className="table-card">
      <Table rowKey="sectionId" columns={columns} dataSource={value.sections} pagination={false} />
    </SectionCard>
  </>;
}
