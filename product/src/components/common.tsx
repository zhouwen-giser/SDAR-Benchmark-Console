import { useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Result,
  Skeleton,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  ApiOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { capabilityStatusLabel } from "../api/capability-map";
import type { CapabilityMeta, UiDataState } from "../types";
import { overviewText } from "../utils/format";

export function ApiStatusTag({ meta, compact = false }: { meta: CapabilityMeta; compact?: boolean }) {
  const colors = {
    existing: "green",
    extend: "gold",
    new: "blue",
    blocked_data: "volcano",
    external: "purple",
  } as const;
  const content = (
    <Space size={4} wrap>
      <Tag color={colors[meta.status]} icon={<ApiOutlined />}>
        {meta.availability === "unavailable" ? "UNAVAILABLE" : meta.availability === "partial" ? "PARTIAL" : capabilityStatusLabel[meta.status]}
      </Tag>
      {meta.mocked && <Tag color="purple">MOCK</Tag>}
      {!meta.mocked && <Tag color="green">HTTP</Tag>}
      {!compact && meta.watermark && (
        <span className="api-watermark">
          <ClockCircleOutlined /> {meta.watermark.slice(11, 19)}
        </span>
      )}
    </Space>
  );
  return (
    <Tooltip
      placement="bottomRight"
      title={
        <div className="api-tooltip">
          <b>接口：{meta.endpoint}</b>
          <div>Operation：{meta.operationId}</div>
          <div>可用性：{meta.availability}</div>
          <div>数据来源：{meta.sourceOfTruth}</div>
          <div>投影延迟：{meta.projectionLagMs == null ? "—" : `${(meta.projectionLagMs / 1000).toFixed(1)} 秒`}</div>
          {meta.reasonCodes.length > 0 && <div>原因码：{meta.reasonCodes.join("、")}</div>}
          {meta.unavailableFields.length > 0 && <div>不可用字段：{meta.unavailableFields.join("、")}</div>}
          {meta.warnings.length > 0 && <div>警告：{meta.warnings.join("；")}</div>}
          {meta.contracts.length > 0 && <div>合同：{meta.contracts.join("、")}</div>}
          {meta.availabilityReason && <div>{meta.availabilityReason}</div>}
        </div>
      }
    >
      <span className="api-status-wrap">{content}</span>
    </Tooltip>
  );
}

export function SectionCard({
  title,
  extra,
  children,
  className = "",
  onClick,
  ariaLabel,
}: {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const interactive = Boolean(onClick);
  return (
    <section
      className={`section-card ${interactive ? "section-card-interactive" : ""} ${className}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {(title || extra) && (
        <header className="section-card-header">
          <span>{title}</span>
          <span>{extra}</span>
        </header>
      )}
      <div className="section-card-body">{children}</div>
    </section>
  );
}

export function DataStatePanel({
  state,
  onRetry,
  children,
}: {
  state: UiDataState;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (state === "loading") {
    return (
      <div className="dashboard-state-grid" aria-label="正在加载总览数据快照">
        {Array.from({ length: 12 }, (_, index) => (
          <SectionCard key={index} className={index < 3 ? "state-wide" : ""}>
            <Skeleton active paragraph={{ rows: index < 3 ? 2 : 4 }} />
          </SectionCard>
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <SectionCard className="state-result-card">
        <Result
          status="error"
          title="无法加载当前数据快照"
          subTitle="旧数据不会被伪装为实时结果。请重试或切换到“数据已过期”状态查看保留快照的含义。"
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
              重试
            </Button>
          }
        />
      </SectionCard>
    );
  }
  if (state === "empty") {
    return (
      <SectionCard className="state-result-card">
        <Empty description="当前候选版本、数据集和分轨筛选条件下没有可评价数据" />
      </SectionCard>
    );
  }
  return <>{children}</>;
}

export function SnapshotAlert({
  status,
  watermark,
  lagMs,
  moduleErrors,
}: {
  status: "complete" | "partial" | "stale" | "empty";
  watermark: string | null;
  lagMs: number | null;
  moduleErrors: Array<{ module: string; reason: string }>;
}) {
  if (status === "complete") return null;
  const stale = status === "stale";
  return (
    <Alert
      className="snapshot-alert"
      showIcon
      icon={stale ? <ClockCircleOutlined /> : <CloudSyncOutlined />}
      type={stale ? "warning" : "error"}
      message={stale ? "数据快照已过期" : status === "partial" ? "数据不完整" : "数据快照为空"}
      description={
        <span>
          数据水位 {watermark?.slice(11, 19) ?? "—"} · 投影延迟 {lagMs == null ? "—" : `${(lagMs / 1000).toFixed(1)} 秒`}
          {moduleErrors.length > 0 && ` · 受影响模块：${moduleErrors.map((item) => overviewText(item.module)).join("、")}`}
        </span>
      }
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  meta?: CapabilityMeta;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <div className="page-title-row">
          <h1>{title}</h1>
          {meta && <ApiStatusTag meta={meta} />}
        </div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </header>
  );
}

export function DebugPayloadDrawer({
  payload,
  label = "查看原始数据",
}: {
  payload: unknown;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" type="link" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer
        title="Debug Payload"
        placement="right"
        width={680}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          message="仅用于开发诊断"
          description="产品主视图使用类型化卡片、表格和时间轴；此处保留服务端原始响应便于排障。"
        />
        <pre className="debug-payload-json">{JSON.stringify(payload, null, 2)}</pre>
      </Drawer>
    </>
  );
}

export function MockCornerBadge() {
  return (
    <div className="mock-corner-badge" aria-label="当前页面使用演示数据">
      演示数据适配器 · 接口缺口已明确标注
    </div>
  );
}
