import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Select, Table, Tag, message } from "antd";
import { ApiOutlined, DatabaseOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import { adapterName, releaseStatusName, statusName } from "../utils/format";

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
    // Device-local state must be restored after the client has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setPreferences({ ...defaults, ...JSON.parse(stored) as Partial<LocalPreferences> }); } catch { /* keep safe defaults */ }
  }, []);

  const save = () => {
    window.localStorage.setItem("sdar-console-preferences", JSON.stringify(preferences));
    setFilters({ scenario: preferences.scenario, period: preferences.period }, { replace: true });
    messageApi.success("设备本地偏好已保存");
  };

  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载系统工作区…</div></SectionCard></div>;
  const { data, meta } = query.data;
  const serviceColumns = [
    { title: "服务", dataIndex: "name", key: "name", render: (value: string) => <b>{value}</b> },
    { title: "职责", dataIndex: "role", key: "role" },
    { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "healthy" ? "green" : value === "external" ? "purple" : "gold"}>{statusName(value)}</Tag> },
    { title: "说明", dataIndex: "detail", key: "detail" },
  ];
  const contractColumns = [
    { title: "合同", dataIndex: "name", key: "name" },
    { title: "版本", dataIndex: "version", key: "version" },
    { title: "来源文件", dataIndex: "source", key: "source", render: (value: string) => <code>{value}</code> },
    { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "active" ? "green" : "gold"}>{statusName(value)}</Tag> },
  ];
  const projectionColumns = [
    { title: "数据投影", dataIndex: "name", key: "name" },
    { title: "数据水位", dataIndex: "watermark", key: "watermark" },
    { title: "延迟", dataIndex: "lagMs", key: "lagMs", render: (value: number) => `${(value / 1000).toFixed(1)} 秒` },
    { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "healthy" ? "green" : "gold"}>{statusName(value)}</Tag> },
  ];

  return (
    <div className="standard-page settings-page">
      {contextHolder}
      <PageHeader title="设置与系统" subtitle="审阅服务边界、接口适配模式、版本化合同与设备本地显示偏好。" meta={meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新状态</Button>} />
      <Alert type="info" showIcon message="内部研发分析台边界" description="不建设账户、基于角色的访问控制、租户或组织管理。接口适配模式由构建时环境变量决定；此处保存的适配模式仅是本设备的联调偏好。" />
      <div className="settings-grid">
        <SectionCard title={<span><SettingOutlined /> 设备本地偏好</span>} className="settings-span-4">
          <div className="settings-form">
            <label><span>界面密度</span><Select value={preferences.density} options={[{ value: "compact", label: "紧凑" }, { value: "comfortable", label: "舒适" }]} onChange={(density) => setPreferences((current) => ({ ...current, density }))} /></label>
            <label><span>默认场景</span><Select value={preferences.scenario} options={[{ value: "blocked", label: releaseStatusName("blocked") }, { value: "ready", label: releaseStatusName("ready") }, { value: "invalid", label: releaseStatusName("invalid") }]} onChange={(scenario) => setPreferences((current) => ({ ...current, scenario }))} /></label>
            <label><span>默认时间范围</span><Select value={preferences.period} options={[{ value: "7d", label: "最近 7 天" }, { value: "14d", label: "最近 14 天" }, { value: "30d", label: "最近 30 天" }]} onChange={(period) => setPreferences((current) => ({ ...current, period }))} /></label>
            <label><span>接口适配偏好</span><Select value={preferences.adapter} options={data.adapters.map((item) => ({ value: item.mode, label: adapterName(item.mode) }))} onChange={(adapter) => setPreferences((current) => ({ ...current, adapter }))} /></label>
            <Button type="primary" block onClick={save}>保存本地偏好</Button>
          </div>
        </SectionCard>
        <SectionCard title={<span><ApiOutlined /> 接口适配模式</span>} className="settings-span-8">
          <div className="adapter-grid">{data.adapters.map((adapter) => <article key={adapter.mode} className={preferences.adapter === adapter.mode ? "selected" : ""} onClick={() => setPreferences((current) => ({ ...current, adapter: adapter.mode }))}><div><Tag color={adapter.mode === "mock" ? "purple" : adapter.mode === "http" ? "green" : "blue"}>{adapterName(adapter.mode)}</Tag>{preferences.adapter === adapter.mode && <small>当前本地偏好</small>}</div><h3>{adapter.description}</h3><p>{adapter.recommendedFor}</p></article>)}</div>
          <Descriptions column={2} size="small" items={[
            { key: "env", label: "运行时模式选择变量", children: <code>VITE_API_MODE</code> },
            { key: "base", label: "HTTP 接口基础地址", children: <code>VITE_BENCHMARK_API_BASE_URL</code> },
            { key: "fallback", label: "回退策略", children: "仅混合模式可用，且必须显式、范围受限" },
            { key: "mock", label: "演示数据标识", children: "所有演示数据资源都会显示来源标识" },
          ]} />
        </SectionCard>
        <SectionCard title={<span><DatabaseOutlined /> 服务边界</span>} className="settings-span-12 table-card"><Table rowKey="name" columns={serviceColumns} dataSource={data.services} pagination={false} /></SectionCard>
        <SectionCard title="版本化合同" className="settings-span-7 table-card"><Table rowKey="name" columns={contractColumns} dataSource={data.contracts} pagination={false} /></SectionCard>
        <SectionCard title="数据投影水位" className="settings-span-5 table-card"><Table rowKey="name" columns={projectionColumns} dataSource={data.projections} pagination={false} /></SectionCard>
      </div>
    </div>
  );
}
