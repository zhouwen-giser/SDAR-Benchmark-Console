import { Button, Checkbox, Descriptions, InputNumber, Select, Space, Table, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

export interface RunCatalogOption {
  id: string;
  label: string;
  availability?: "available" | "unavailable";
}

export interface RunPresetCatalogOption extends RunCatalogOption {
  datasetVersionRef: string;
  candidateSnapshotRef: string;
  candidateSnapshotRefs: string[];
  selectedCaseIds: string[];
  repeatCount: number;
  dataClass: string;
}

export interface RunCaseCatalogOption {
  caseId: string;
  label: string;
  track: string;
  riskLevel?: string;
}

export interface RunCatalogSelection {
  presetId: string;
  datasetVersionRef: string;
  candidateSnapshotRef: string;
  target: "simulated" | "live";
  selectedCaseIds: string[];
  repeatCount: number;
}

export function RunCatalogConfigurator({ presets, datasets, candidates, cases, value, onChange }: {
  presets: RunPresetCatalogOption[];
  datasets: RunCatalogOption[];
  candidates: RunCatalogOption[];
  cases: RunCaseCatalogOption[];
  value: RunCatalogSelection;
  onChange: (value: RunCatalogSelection) => void;
}) {
  const set = (next: Partial<RunCatalogSelection>) => onChange({ ...value, ...next });
  const selectPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    set({ presetId, datasetVersionRef: preset.datasetVersionRef, candidateSnapshotRef: preset.candidateSnapshotRef, selectedCaseIds: [...preset.selectedCaseIds], repeatCount: preset.repeatCount });
  };
  const availableCases = cases.filter((item) => value.selectedCaseIds.includes(item.caseId));
  const selectCases = (selected: string[]) => {
    const retained = value.selectedCaseIds.filter((caseId) => selected.includes(caseId));
    const added = cases.map((item) => item.caseId).filter((caseId) => selected.includes(caseId) && !retained.includes(caseId));
    set({ selectedCaseIds: [...retained, ...added] });
  };
  const move = (caseId: string, offset: -1 | 1) => {
    const selectedCaseIds = [...value.selectedCaseIds];
    const source = selectedCaseIds.indexOf(caseId);
    const target = source + offset;
    if (source < 0 || target < 0 || target >= selectedCaseIds.length) return;
    [selectedCaseIds[source], selectedCaseIds[target]] = [selectedCaseIds[target]!, selectedCaseIds[source]!];
    set({ selectedCaseIds });
  };

  return <div className="run-catalog-configurator">
    <div className="run-catalog-fields">
      <label><span>Preset</span><Select aria-label="Preset" value={value.presetId} onChange={selectPreset} options={presets.map((item) => ({ value: item.id, label: item.label, disabled: item.availability === "unavailable" }))} /></label>
      <label><span>Dataset version</span><Select aria-label="Dataset version" value={value.datasetVersionRef} onChange={(datasetVersionRef) => set({ datasetVersionRef })} options={datasets.map((item) => ({ value: item.id, label: item.label, disabled: item.availability === "unavailable" }))} /></label>
      <label><span>Candidate</span><Select aria-label="Candidate" value={value.candidateSnapshotRef} onChange={(candidateSnapshotRef) => set({ candidateSnapshotRef })} options={candidates.map((item) => ({ value: item.id, label: item.label, disabled: item.availability === "unavailable" }))} /></label>
      <label><span>Environment / Target</span><Select aria-label="Environment / Target" value={value.target} onChange={(target) => set({ target })} options={[{ value: "simulated", label: "Development · simulated" }, { value: "live", label: "Development · live" }]} /></label>
      <label><span>Repeat count</span><InputNumber aria-label="Repeat count" min={1} max={20} value={value.repeatCount} onChange={(repeatCount) => set({ repeatCount: repeatCount ?? 1 })} /></label>
    </div>
    <Descriptions size="small" column={3} items={[
      { key: "preset", label: "Preset ID", children: <code>{value.presetId}</code> },
      { key: "cases", label: "Selected Cases", children: value.selectedCaseIds.length },
      { key: "formal", label: "Boundary", children: <Tag color="red">NOT FORMAL</Tag> },
    ]} />
    <div className="run-catalog-case-selector">
      <b>Case subset</b>
      <Checkbox.Group value={value.selectedCaseIds} onChange={(selected) => selectCases(selected as string[])}>
        <div className="run-catalog-case-grid">{cases.map((item) => <Checkbox key={item.caseId} value={item.caseId}><code>{item.caseId}</code> · {item.label}</Checkbox>)}</div>
      </Checkbox.Group>
    </div>
    <Table<RunCaseCatalogOption>
      rowKey="caseId"
      size="small"
      pagination={false}
      dataSource={value.selectedCaseIds.flatMap((caseId) => {
        const item = availableCases.find((candidate) => candidate.caseId === caseId);
        return item ? [item] : [];
      })}
      columns={[
        { title: "Order", render: (_, item, index) => <Space size={2}><span>{index + 1}</span><Button aria-label={`${item.caseId} up`} size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(item.caseId, -1)} /><Button aria-label={`${item.caseId} down`} size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === value.selectedCaseIds.length - 1} onClick={() => move(item.caseId, 1)} /></Space> },
        { title: "Case", dataIndex: "caseId", render: (caseId: string) => <code>{caseId}</code> },
        { title: "Scenario", dataIndex: "label" },
        { title: "Track", dataIndex: "track", render: (track: string) => <Tag>{track}</Tag> },
        { title: "Risk", dataIndex: "riskLevel", render: (risk?: string) => risk ?? "—" },
      ]}
    />
  </div>;
}
