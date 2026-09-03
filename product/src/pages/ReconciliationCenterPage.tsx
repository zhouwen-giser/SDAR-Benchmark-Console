import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Drawer, Space, Table, Tag, message } from "antd";
import { EyeOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag, SourceIdentity, compactTimestamp } from "../operational/components";
import type { ReconciliationEventView, ReconciliationJobView } from "../operational/types";

export function ReconciliationCenterPage() {
  const query = useQuery({ queryKey: ["operational", "reconciliation-jobs"], queryFn: () => operationalApi.listReconciliationJobs() });
  const [selected, setSelected] = useState<ReconciliationJobView | null>(null);
  const events = useQuery({ queryKey: ["operational", "reconciliation-job", selected?.jobId, "events"], queryFn: () => operationalApi.listReconciliationJobEvents(selected!.jobId), enabled: Boolean(selected) });
  const [messageApi, contextHolder] = message.useMessage();
  const cancel = useMutation({ mutationFn: (id: string) => operationalApi.cancelReconciliationJob(id), onSuccess: (resource) => { setSelected(resource.data); messageApi.success("Reconciliation job 已取消"); void query.refetch(); }, onError: (error) => messageApi.error(error instanceof Error ? error.message : "Cancel failed") });
  if (query.isLoading) return <div className="standard-page"><OperationalLoading /></div>;
  if (query.isError || !query.data) return <div className="standard-page"><OperationalError error={query.error ?? new Error("Reconciliation authority unavailable")} onRetry={() => void query.refetch()} /></div>;
  const rows = query.data.data;
  return <div className="standard-page operational-page reconciliation-page">
    {contextHolder}
    <PageHeader title="Reconciliation Center" subtitle="PostgreSQL-authoritative reread/relink/rebuild/replay/cleanup jobs；永不 redispatch navigation、MCP Task 或 Provider Execution。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <OperationalMetaStrip meta={query.data.meta} />
    <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
    <Alert type="info" showIcon message="Side-effect policy" description="Every job must report sideEffectPolicy=no_new_physical_side_effect. Historical Evaluation and Artifact revisions remain immutable." />
    <div className="operational-kpi-grid">
      <SectionCard><span>Jobs</span><strong>{rows.length}</strong><small>durable PG authority</small></SectionCard>
      <SectionCard><span>Running / waiting</span><strong>{rows.filter((item) => item.state === "running" || item.state === "waiting_source").length}</strong><small>restart-safe</small></SectionCard>
      <SectionCard><span>Partial / failed</span><strong>{rows.filter((item) => item.state === "completed_partial" || item.state === "failed").length}</strong><small>attention-linked</small></SectionCard>
      <SectionCard><span>Physical side effects</span><strong>0</strong><small>hard invariant</small></SectionCard>
    </div>
    <SectionCard title="Reconciliation jobs"><Table<ReconciliationJobView> rowKey="jobId" pagination={false} dataSource={rows} scroll={{ x: 1400 }} columns={[
      { title: "Job", dataIndex: "jobId", fixed: "left", render: (value: string, row) => <button className="link-button" onClick={() => setSelected(row)}>{value}</button> },
      { title: "Run", dataIndex: "runId" }, { title: "Type", dataIndex: "type" }, { title: "State", dataIndex: "state", render: (value: string) => <OperationalStatusTag value={value} /> },
      { title: "Scopes", dataIndex: "scopes", render: (values: string[]) => values.map((value) => <Tag key={value}>{value}</Tag>) }, { title: "Policy", dataIndex: "sideEffectPolicy" },
      { title: "Updated", dataIndex: "updatedAt", render: compactTimestamp }, { title: "", key: "actions", fixed: "right", render: (_: unknown, row) => <Button type="text" icon={<EyeOutlined />} aria-label={`查看 ${row.jobId}`} onClick={() => setSelected(row)} /> },
    ]} /></SectionCard>
    <Drawer open={selected !== null} onClose={() => setSelected(null)} width={820} title={selected ? `Reconciliation · ${selected.jobId}` : "Reconciliation"} extra={selected && !terminal(selected.state) && <Button danger icon={<StopOutlined />} loading={cancel.isPending} onClick={() => cancel.mutate(selected.jobId)}>取消</Button>}>
      {selected && <div className="operational-drawer-stack">
        <SourceIdentity values={[
          { label: "Job", value: selected.jobId }, { label: "Run", value: selected.runId }, { label: "Repetition", value: selected.repetitionId ?? "run scope" },
          { label: "Type", value: selected.type }, { label: "State", value: <OperationalStatusTag value={selected.state} /> }, { label: "Policy", value: selected.sideEffectPolicy },
          { label: "Created", value: compactTimestamp(selected.createdAt) }, { label: "Updated", value: compactTimestamp(selected.updatedAt) }, { label: "Completed", value: compactTimestamp(selected.completedAt) },
        ]} />
        <Descriptions bordered column={1} items={[{ key: "scopes", label: "Scopes", children: selected.scopes.map((value) => <Tag key={value}>{value}</Tag>) }, { key: "reasons", label: "Reasons", children: selected.reasonCodes.join(" · ") || "—" }, { key: "result", label: "Result", children: selected.result ? JSON.stringify(selected.result) : "—" }]} />
        <SectionCard title="Durable job events">{events.isError ? <OperationalError error={events.error} /> : <Table<ReconciliationEventView> rowKey="eventId" size="small" pagination={false} loading={events.isLoading} dataSource={events.data?.data ?? []} columns={[
          { title: "Event", dataIndex: "eventId" }, { title: "Revision", dataIndex: "revision" }, { title: "Type", dataIndex: "eventType", render: (value: string) => <OperationalStatusTag value={value} /> }, { title: "Occurred", dataIndex: "occurredAt", render: compactTimestamp }, { title: "Reasons", dataIndex: "reasonCodes", render: (values: string[]) => values.join(" · ") || "—" },
        ]} />}</SectionCard>
      </div>}
    </Drawer>
  </div>;
}

function terminal(state: ReconciliationJobView["state"]) { return ["completed", "completed_partial", "failed", "cancelled"].includes(state); }
