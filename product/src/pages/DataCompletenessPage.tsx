import { useQuery } from "@tanstack/react-query";
import { Button, Result } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { DataCompletenessPanel } from "../components/DataCompletenessPanel";

export function DataCompletenessPage() {
  const query = useQuery({ queryKey: ["data-completeness"], queryFn: ({ signal }) => consoleApi.getDataCompleteness({ signal }), retry: false });
  if (query.isLoading) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载数据完整性…</div></SectionCard></div>;
  if (query.isError || !query.data) return <div className="standard-page"><Result status="warning" title="数据完整性不可用" subTitle={query.error instanceof Error ? query.error.message : "接口未返回有效数据"} extra={<Button onClick={() => void query.refetch()}>重试</Button>} /></div>;
  return <div className="standard-page data-completeness-page">
    <PageHeader title="数据完整性" subtitle="逐层展示 Registry、Run Authority、Analytics Projection、Identity、Artifact 与 Formalization 的真实覆盖；缺失数据保持 partial/unavailable。" meta={query.data.meta} actions={<><ApiStatusTag meta={query.data.meta} /><Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>刷新</Button></>} />
    <DataCompletenessPanel value={query.data.data} />
  </div>;
}
