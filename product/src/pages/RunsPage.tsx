import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Progress, Select, Tag } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { RunSummary } from "../types";
import { compactTime, displayValue, releaseStatusName, statusName } from "../utils/format";

const gateColor: Record<string, string> = { blocked: "red", ready: "green", warning: "gold", invalid: "default" };

export function RunsPage() {
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["runs"], queryFn: () => consoleApi.listRuns() });
  const columns: ProColumns<RunSummary>[] = [
    { title: "运行编号", dataIndex: "runId", fixed: "left", width: 165, copyable: true },
    { title: "候选版本", dataIndex: "candidate", width: 190 },
    { title: "数据集", dataIndex: "dataset", width: 130 },
    { title: "评价配置", dataIndex: "profile", width: 180, ellipsis: true },
    {
      title: "用例数 / 已完成",
      key: "progress",
      width: 160,
      render: (_, row) => <div className="run-progress"><Progress percent={Math.round((row.completed / row.cases) * 100)} size="small" showInfo={false} /><span>{row.completed}/{row.cases}</span></div>,
    },
    { title: "通过率", dataIndex: "passRate", width: 100, render: (_, row) => displayValue(row.passRate, "%") },
    { title: "质量得分", dataIndex: "qualityScore", width: 95, render: (_, row) => displayValue(row.qualityScore) },
    { title: "致命问题", dataIndex: "fatal", width: 90, render: (_, row) => <span className={(row.fatal ?? 0) > 0 ? "text-danger" : ""}>{displayValue(row.fatal)}</span> },
    { title: "硬门槛失败", dataIndex: "hg", width: 105, render: (_, row) => <span className={(row.hg ?? 0) > 0 ? "text-danger" : ""}>{displayValue(row.hg)}</span> },
    { title: "未就绪", dataIndex: "nr", width: 80, render: (_, row) => displayValue(row.nr) },
    { title: "发布门槛", dataIndex: "releaseGate", width: 118, render: (_, row) => <Tag color={gateColor[row.releaseGate]}>{releaseStatusName(row.releaseGate)}</Tag> },
    { title: "权威状态", dataIndex: "status", width: 105, render: (_, row) => <Tag color="green">{statusName(row.status)}</Tag> },
    { title: "完成时间", dataIndex: "completedAt", width: 140, render: (_, row) => compactTime(row.completedAt) },
    { title: "", valueType: "option", fixed: "right", width: 58, render: (_, row) => <Button type="text" aria-label={`打开 ${row.runId}`} icon={<EyeOutlined />} onClick={() => navigateWithContext(`/runs/${row.runId}`)} /> },
  ];

  return (
    <div className="standard-page">
      <PageHeader
        title="基准评测运行"
        subtitle="运行权威状态来自 PostgreSQL；完成后的质量结果来自 ClickHouse 投影，投影等待中不会显示为 0。"
        meta={query.data?.meta}
        actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>}
      />
      <SectionCard className="table-card">
        <div className="run-filter-strip">
          <Select value="all" options={[{ value: "all", label: "全部状态" }, { value: "completed", label: statusName("completed") }]} />
          <Select value="all" options={[{ value: "all", label: "全部候选版本" }, { value: "1.4.2", label: "SDAR 1.4.2" }]} />
          <Select value="all" options={[{ value: "all", label: "全部发布门槛" }, { value: "blocked", label: releaseStatusName("blocked") }]} />
          <span className="table-watermark">数据水位 {query.data?.meta.watermark?.slice(11, 19) ?? "—"}</span>
        </div>
        <ProTable<RunSummary>
          rowKey="runId"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isLoading}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 1640 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(row) => ({ onDoubleClick: () => navigateWithContext(`/runs/${row.runId}`) })}
        />
      </SectionCard>
    </div>
  );
}
