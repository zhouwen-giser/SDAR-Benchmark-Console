import { Button, Checkbox, Descriptions, InputNumber, Select, Space, Switch, Table, Tag } from "antd";
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
  target: "simulated" | "live_native";
  nativeRequirement: "prefer_native" | "require_native";
  environmentId: string | null;
  resourceIds: string[];
  telemetryPolicy: "require_full" | "allow_partial" | "development_relay";
  observationTimePolicy: "require_source_observed_at" | "allow_received_at_fallback";
  reconciliationPolicy: "automatic" | "manual";
  streamingEnabled: boolean;
  selectedCaseIds: string[];
  repeatCount: number;
}

export function executionTargetDefaults(target: RunCatalogSelection["target"]): Pick<
  RunCatalogSelection,
  "nativeRequirement" | "telemetryPolicy" | "observationTimePolicy" | "reconciliationPolicy" | "streamingEnabled"
> {
  return {
    nativeRequirement: target === "live_native" ? "require_native" : "prefer_native",
    telemetryPolicy: target === "live_native" ? "require_full" : "allow_partial",
    observationTimePolicy: "require_source_observed_at",
    reconciliationPolicy: "automatic",
    streamingEnabled: true,
  };
}

export function RunCatalogConfigurator({ presets, datasets, candidates, cases, environments = [], resources = [], value, onChange }: {
  presets: RunPresetCatalogOption[];
  datasets: RunCatalogOption[];
  candidates: RunCatalogOption[];
  cases: RunCaseCatalogOption[];
  environments?: RunCatalogOption[];
  resources?: Array<RunCatalogOption & { environmentId?: string }>;
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
      <label><span>Execution target</span><Select aria-label="Execution target" value={value.target} onChange={(target) => set({
        target,
        ...executionTargetDefaults(target),
      })} options={[{ value: "simulated", label: "Development · simulated" }, { value: "live_native", label: "Development · live native" }]} /></label>
      <label><span>Native requirement</span><Select aria-label="Native requirement" value={value.nativeRequirement} onChange={(nativeRequirement) => set({ nativeRequirement })} options={[{ value: "prefer_native", label: "Prefer native" }, { value: "require_native", label: "Require native" }]} /></label>
      <label><span>Environment</span><Select aria-label="Environment" allowClear value={value.environmentId} onChange={(environmentId) => set({ environmentId: environmentId ?? null, resourceIds: [] })} options={environments.map((item) => ({ value: item.id, label: item.label, disabled: item.availability === "unavailable" }))} /></label>
      <label><span>Resources</span><Select aria-label="Resources" mode="multiple" value={value.resourceIds} onChange={(resourceIds) => set({ resourceIds })} options={resources.filter((item) => !item.environmentId || item.environmentId === value.environmentId).map((item) => ({ value: item.id, label: item.label, disabled: item.availability === "unavailable" }))} /></label>
      <label><span>Telemetry policy</span><Select aria-label="Telemetry policy" value={value.telemetryPolicy} onChange={(telemetryPolicy) => set({ telemetryPolicy })} options={[{ value: "require_full", label: "Require full" }, { value: "allow_partial", label: "Allow partial" }, { value: "development_relay", label: "Development relay" }]} /></label>
      <label><span>Observation time</span><Select aria-label="Observation time policy" value={value.observationTimePolicy} onChange={(observationTimePolicy) => set({ observationTimePolicy })} options={[{ value: "require_source_observed_at", label: "Require sourceObservedAt" }, { value: "allow_received_at_fallback", label: "Allow receivedAt fallback" }]} /></label>
      <label><span>Reconciliation</span><Select aria-label="Reconciliation policy" value={value.reconciliationPolicy} onChange={(reconciliationPolicy) => set({ reconciliationPolicy })} options={[{ value: "automatic", label: "Automatic" }, { value: "manual", label: "Manual" }]} /></label>
      <label><span>Streaming</span><Switch aria-label="Streaming enabled" checked={value.streamingEnabled} onChange={(streamingEnabled) => set({ streamingEnabled })} checkedChildren="SSE" unCheckedChildren="Snapshot" /></label>
      <label><span>Repeat count</span><InputNumber aria-label="Repeat count" min={1} max={20} value={value.repeatCount} onChange={(repeatCount) => set({ repeatCount: repeatCount ?? 1 })} /></label>
    </div>
    <Descriptions size="small" column={3} items={[
      { key: "preset", label: "Preset ID", children: <code>{value.presetId}</code> },
      { key: "cases", label: "Selected Cases", children: value.selectedCaseIds.length },
      { key: "native", label: "Native requirement", children: <Tag color={value.nativeRequirement === "require_native" ? "cyan" : "blue"}>{value.nativeRequirement}</Tag> },
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
