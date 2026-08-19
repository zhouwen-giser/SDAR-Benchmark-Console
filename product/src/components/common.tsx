import type { ReactNode } from "react";
import {
  Alert,
  Button,
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
        {capabilityStatusLabel[meta.status]}
      </Tag>
      {meta.mocked && <Tag color="purple">MOCK DATA</Tag>}
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
          <b>{meta.endpoint}</b>
          <div>Source of truth: {meta.sourceOfTruth}</div>
          <div>Projection lag: {meta.projectionLagMs == null ? "—" : `${(meta.projectionLagMs / 1000).toFixed(1)}s`}</div>
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
      <div className="dashboard-state-grid" aria-label="正在加载 Overview Snapshot">
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
          title="无法加载当前 Snapshot"
          subTitle="旧数据不会被伪装为实时结果。请重试或切换到 STALE 演示状态查看保留快照语义。"
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
        <Empty description="当前 Candidate / Dataset / Track 筛选下没有可评价数据" />
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
  watermark: string;
  lagMs: number;
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
      message={stale ? "STALE SNAPSHOT" : status === "partial" ? "PARTIAL DATA" : "EMPTY SNAPSHOT"}
      description={
        <span>
          Watermark {watermark.slice(11, 19)} · Lag {(lagMs / 1000).toFixed(1)}s
          {moduleErrors.length > 0 && ` · ${moduleErrors.map((item) => item.module).join(", ")}`}
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

export function MockCornerBadge() {
  return (
    <div className="mock-corner-badge" aria-label="当前页面使用 Mock 数据">
      MOCK ADAPTER · API GAPS EXPLICIT
    </div>
  );
}
