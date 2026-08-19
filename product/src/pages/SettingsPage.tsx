import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Select, Table, Tag, message } from "antd";
import { ApiOutlined, DatabaseOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";

interface LocalPreferences {
  density: "compact" | "comfortable";
  scenario: "blocked" | "ready" | "invalid";
  period: "7d" | "14d" | "30d";
  adapter: "mock" | "hybrid" | "http" | "msw";
}

const defaults: LocalPreferences = { density: "compact", scenario: "blocked", period: "7d", adapter: "mock" };

export function SettingsPage() {
  const { setFilters } = useAnalysisContext();
  const query = useQuery({ queryKey: ["system-workspace"], queryFn: () => consoleApi.getSystemWorkspace() });
  const [preferences, setPreferences] = useState<LocalPreferences>(defaults);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const stored = window.localStorage.getItem("sdar-console-preferences");
    if (!stored) return;
    try { setPreferences({ ...defaults, ...JSON.parse(stored) as Partial<LocalPreferences> }); } catch { /* keep safe defaults */ }
  }, []);

  const save = () => {
    window.localStorage.setItem("sdar-console-preferences", JSON.stringify(preferences));
    setFilters({ scenario: preferences.scenario, period: preferences.period }, { replace: true });
    messageApi.success("设备本地偏好已保存");
  };

  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 System Workspace…</div></SectionCard></div>;
  const { data, meta } = query.data;
  const serviceColumns = [
    { title: "Service", dataIndex: "name", key: "name", render: (value: string) => <b>{value}</b> },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "healthy" ? "green" : value === "external" ? "purple" : "gold"}>{value}</Tag> },
    { title: "Detail", dataIndex: "detail", key: "detail" },
  ];
  const contractColumns = [
    { title: "Contract", dataIndex: "name", key: "name" },
    { title: "Version", dataIndex: "version", key: "version" },
    { title: "Source", dataIndex: "source", key: "source", render: (value: string) => <code>{value}</code> },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "active" ? "green" : "gold"}>{value}</Tag> },
  ];
  const projectionColumns = [
    { title: "Projection", dataIndex: "name", key: "name" },
    { title: "Watermark", dataIndex: "watermark", key: "watermark" },
    { title: "Lag", dataIndex: "lagMs", key: "lagMs", render: (value: number) => `${(value / 1000).toFixed(1)}s` },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "healthy" ? "green" : "gold"}>{value}</Tag> },
  ];

  return (
    <div className="standard-page settings-page">
      {contextHolder}
      <PageHeader title="Settings & System" subtitle="审阅服务边界、API Adapter、版本化合同与设备本地显示偏好。" meta={meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新状态</Button>} />
      <Alert type="info" showIcon message="内部研发分析台边界" description="不建设账户、RBAC、租户或组织管理。Adapter 模式由构建时环境变量决定；此处保存的 adapter 仅是本设备的联调偏好说明。" />
      <div className="settings-grid">
        <SectionCard title={<span><SettingOutlined /> Device-local Preferences</span>} className="settings-span-4">
          <div className="settings-form">
            <label><span>Density</span><Select value={preferences.density} options={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }]} onChange={(density) => setPreferences((current) => ({ ...current, density }))} /></label>
            <label><span>Default scenario</span><Select value={preferences.scenario} options={[{ value: "blocked", label: "BLOCKED" }, { value: "ready", label: "READY" }, { value: "invalid", label: "INVALID" }]} onChange={(scenario) => setPreferences((current) => ({ ...current, scenario }))} /></label>
            <label><span>Default period</span><Select value={preferences.period} options={[{ value: "7d", label: "最近 7 天" }, { value: "14d", label: "最近 14 天" }, { value: "30d", label: "最近 30 天" }]} onChange={(period) => setPreferences((current) => ({ ...current, period }))} /></label>
            <label><span>Adapter preference</span><Select value={preferences.adapter} options={data.adapters.map((item) => ({ value: item.mode, label: item.mode.toUpperCase() }))} onChange={(adapter) => setPreferences((current) => ({ ...current, adapter }))} /></label>
            <Button type="primary" block onClick={save}>保存本地偏好</Button>
          </div>
        </SectionCard>
        <SectionCard title={<span><ApiOutlined /> API Adapter Modes</span>} className="settings-span-8">
          <div className="adapter-grid">{data.adapters.map((adapter) => <article key={adapter.mode} className={preferences.adapter === adapter.mode ? "selected" : ""} onClick={() => setPreferences((current) => ({ ...current, adapter: adapter.mode }))}><div><Tag color={adapter.mode === "mock" ? "purple" : adapter.mode === "http" ? "green" : "blue"}>{adapter.mode.toUpperCase()}</Tag>{preferences.adapter === adapter.mode && <small>LOCAL PREFERENCE</small>}</div><h3>{adapter.description}</h3><p>{adapter.recommendedFor}</p></article>)}</div>
          <Descriptions column={2} size="small" items={[
            { key: "env", label: "Runtime selector", children: <code>VITE_API_MODE</code> },
            { key: "base", label: "HTTP base URL", children: <code>VITE_BENCHMARK_API_BASE_URL</code> },
            { key: "fallback", label: "Fallback", children: "Hybrid only; explicit and bounded" },
            { key: "mock", label: "Mock labeling", children: "Visible on every mocked resource" },
          ]} />
        </SectionCard>
        <SectionCard title={<span><DatabaseOutlined /> Service Boundaries</span>} className="settings-span-12 table-card"><Table rowKey="name" columns={serviceColumns} dataSource={data.services} pagination={false} /></SectionCard>
        <SectionCard title="Versioned Contracts" className="settings-span-7 table-card"><Table rowKey="name" columns={contractColumns} dataSource={data.contracts} pagination={false} /></SectionCard>
        <SectionCard title="Projection Watermarks" className="settings-span-5 table-card"><Table rowKey="name" columns={projectionColumns} dataSource={data.projections} pagination={false} /></SectionCard>
      </div>
    </div>
  );
}
