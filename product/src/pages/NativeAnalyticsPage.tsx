import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Table, Tabs, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { PageHeader, SectionCard } from "../components/common";
import { operationalApi } from "../operational/api";
import { NativeBoundaryNotice, OperationalError, OperationalLoading, OperationalMetaStrip, OperationalStatusTag } from "../operational/components";
import type { NativeAnalyticsModuleView } from "../operational/types";

const modules: Array<{ key: NativeAnalyticsModuleView["module"]; label: string }> = [
  { key: "native-coverage", label: "Native Coverage" },
  { key: "telemetry-lag", label: "Telemetry Lag" },
  { key: "reconciliation", label: "Reconciliation" },
  { key: "identity-closure", label: "Identity Closure" },
  { key: "environment-reliability", label: "Environment Reliability" },
  { key: "physical-verification", label: "Physical Verification" },
];

export function NativeAnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("module");
  const active = modules.some((item) => item.key === requested) ? requested as NativeAnalyticsModuleView["module"] : modules[0].key;
  const query = useQuery({ queryKey: ["operational", "native-analytics", active], queryFn: () => operationalApi.getNativeAnalytics(active) });
  return <div className="standard-page operational-page native-analytics-page">
    <PageHeader title="Native Analytics" subtitle="六个 module-specific typed views；仅作 Development native operational diagnosis，不创建 Formal Score。" actions={<Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button>} />
    <Alert type="info" showIcon message="Non-formal boundary" description="These modules publish dataClass and availability. No row is a Formal Score, Baseline, or Release Gate result." />
    <Tabs activeKey={active} onChange={(module) => setParams({ module })} items={modules.map((module) => ({ key: module.key, label: module.label }))} />
    {query.isLoading ? <OperationalLoading /> : query.isError || !query.data ? <OperationalError error={query.error ?? new Error("Native analytics unavailable")} onRetry={() => void query.refetch()} /> : <>
      <OperationalMetaStrip meta={query.data.meta} />
      <NativeBoundaryNotice dataClass={query.data.meta.dataClass} />
      <SectionCard title={modules.find((item) => item.key === active)!.label} extra={<><OperationalStatusTag value={query.data.data.availability} /><Tag>{query.data.data.rows.length} rows</Tag></>}>
        <Table rowKey="rowId" pagination={{ pageSize: 20 }} dataSource={query.data.data.rows} scroll={{ x: "max-content" }} columns={[
          { title: "Row", dataIndex: "rowId", render: (value: string) => <code>{value}</code> },
          { title: "Status", dataIndex: "status", render: (value: string) => <OperationalStatusTag value={value} /> },
          { title: "Value", dataIndex: "value", render: (value: number | null | undefined) => value == null ? "—" : value },
          { title: "Source refs", dataIndex: "sourceRefs", render: (values: string[] | undefined) => values?.join(" · ") || "—" },
          { title: "Reason codes", dataIndex: "reasonCodes", render: (values: string[] | undefined) => values?.join(" · ") || "—" },
        ]} />
      </SectionCard>
    </>}
  </div>;
}
