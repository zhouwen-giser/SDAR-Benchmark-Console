"use client";

import {
  Fragment,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export type ThemeConfig = Record<string, unknown>;
export const theme = { darkAlgorithm: "dark" };

export function ConfigProvider({ children }: { locale?: unknown; theme?: ThemeConfig; children: ReactNode }) {
  return <>{children}</>;
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  type?: "primary" | "default" | "dashed" | "link" | "text";
  size?: "small" | "middle" | "large";
  icon?: ReactNode;
  block?: boolean;
  danger?: boolean;
  loading?: boolean;
};

export function Button({ type = "default", size = "middle", icon, block, danger, loading, className = "", children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type="button"
      disabled={disabled || loading}
      className={`ant-btn ant-btn-${type} ant-btn-${size} ${block ? "ant-btn-block" : ""} ${danger ? "ant-btn-danger" : ""} ${className}`}
    >
      {icon}
      {children != null && <span>{children}</span>}
    </button>
  );
}

const tagColors: Record<string, string> = {
  default: "#73869a",
  blue: "#3b82f6",
  cyan: "#20a8b8",
  green: "#28a565",
  gold: "#b98a2e",
  orange: "#d4772c",
  volcano: "#d4513c",
  red: "#dc4655",
  magenta: "#c64d88",
  purple: "#8e67d4",
};

export function Tag({ color = "default", icon, closable, onClose, children, className = "" }: {
  color?: string;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const tint = tagColors[color] ?? color;
  return (
    <span className={`ant-tag ${className}`} style={{ "--tag-color": tint } as CSSProperties}>
      {icon}{children}
      {closable && <button className="ant-tag-close" aria-label="移除" onClick={(event) => { event.stopPropagation(); onClose?.(); }}>×</button>}
    </span>
  );
}

export function Space({ children, size = 8, wrap = false, className = "" }: {
  children?: ReactNode;
  size?: number | string;
  wrap?: boolean;
  className?: string;
}) {
  return <span className={`ant-space ${className}`} style={{ gap: typeof size === "number" ? size : 8, flexWrap: wrap ? "wrap" : "nowrap" }}>{children}</span>;
}

export function Tooltip({ children, title, placement: _placement }: { children: ReactNode; title?: ReactNode; placement?: string }) {
  const text = typeof title === "string" ? title : undefined;
  return <span className="ant-tooltip-trigger" title={text}>{children}</span>;
}

type SelectOption<T> = { value: T; label: ReactNode };
type SelectProps<T extends string | number = string> = {
  value?: T;
  defaultValue?: T;
  options?: SelectOption<T>[];
  onChange?: (value: any) => void;
  allowClear?: boolean;
  placeholder?: string;
  size?: "small" | "middle" | "large";
  className?: string;
  "aria-label"?: string;
};

export function Select<T extends string | number = string>({
  value,
  defaultValue,
  options = [],
  onChange,
  allowClear,
  placeholder,
  size = "middle",
  className = "",
  "aria-label": ariaLabel,
}: SelectProps<T>) {
  const current = value ?? defaultValue ?? "";
  return (
    <span className={`ant-select ant-select-${size} ${className}`}>
      <select
        aria-label={ariaLabel ?? placeholder}
        value={String(current)}
        onChange={(event) => onChange?.((event.target.value === "" ? undefined : event.target.value) as T)}
      >
        {(allowClear || (placeholder && current === "")) && <option value="">{placeholder ?? "—"}</option>}
        {options.map((option) => <option key={String(option.value)} value={String(option.value)}>{typeof option.label === "string" || typeof option.label === "number" ? option.label : String(option.value)}</option>)}
      </select>
    </span>
  );
}

export function Divider({ children, orientation = "center" }: { children?: ReactNode; orientation?: "left" | "right" | "center" }) {
  return <div className={`ant-divider ant-divider-${orientation}`}><span>{children}</span></div>;
}

export function Drawer({ title, width = 520, open, onClose, extra, children }: {
  title?: ReactNode;
  width?: number | string;
  open?: boolean;
  onClose?: () => void;
  extra?: ReactNode;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="ant-drawer-root" role="dialog" aria-modal="true">
      <button className="ant-drawer-mask" onClick={onClose} aria-label="关闭抽屉" />
      <aside className="ant-drawer" style={{ width }}>
        <header className="ant-drawer-header"><strong>{title}</strong><span>{extra}</span><button className="ant-drawer-close" onClick={onClose} aria-label="关闭">×</button></header>
        <div className="ant-drawer-body">{children}</div>
      </aside>
    </div>
  );
}

export function Progress({ percent = 0, type = "line", strokeColor = "#3b82f6", size, showInfo = true, format }: {
  percent?: number;
  type?: "line" | "circle" | "dashboard";
  strokeColor?: string;
  size?: "small" | "default" | number;
  showInfo?: boolean;
  format?: (percent?: number) => ReactNode;
}) {
  const bounded = Math.max(0, Math.min(100, Number(percent) || 0));
  const label = format ? format(percent) : `${Math.round(bounded)}%`;
  if (type === "circle" || type === "dashboard") {
    const pixels = typeof size === "number" ? size : 86;
    return (
      <span className={`ant-progress ant-progress-${type}`} style={{ width: pixels, height: pixels, background: `conic-gradient(${strokeColor} ${bounded * 3.6}deg, #173047 0deg)` }}>
        <span>{showInfo && label}</span>
      </span>
    );
  }
  return (
    <span className={`ant-progress ant-progress-line ${size === "small" ? "ant-progress-small" : ""}`}>
      <span className="ant-progress-outer"><i style={{ width: `${bounded}%`, background: strokeColor }} /></span>
      {showInfo && <em>{label}</em>}
    </span>
  );
}

export type TableColumn<T> = {
  title?: ReactNode;
  dataIndex?: string;
  key?: string;
  width?: number | string;
  render?: (value: any, row: T, index: number) => ReactNode;
  [key: string]: unknown;
};

type TableProps<T> = {
  columns?: TableColumn<T>[];
  dataSource?: T[];
  rowKey?: string | ((row: T) => string);
  loading?: boolean;
  pagination?: false | { pageSize?: number; showSizeChanger?: boolean };
  scroll?: { x?: number | string; y?: number | string };
  size?: "small" | "middle" | "large";
  rowClassName?: (row: T, index: number) => string;
  onRow?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
  className?: string;
};

function printable(value: unknown): ReactNode {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
}

export function Table<T extends Record<string, any>>({
  columns = [], dataSource = [], rowKey = "key", loading, pagination, scroll, size = "middle", rowClassName, onRow, className = "",
}: TableProps<T>) {
  const pageSize = pagination === false ? dataSource.length : pagination?.pageSize ?? dataSource.length;
  const rows = dataSource.slice(0, pageSize);
  return (
    <div className={`ant-table-wrapper ${className}`} style={{ overflowX: scroll?.x ? "auto" : undefined }}>
      <table className={`ant-table ant-table-${size}`} style={{ minWidth: typeof scroll?.x === "number" ? scroll.x : undefined }}>
        <thead><tr>{columns.map((column, index) => <th key={column.key ?? column.dataIndex ?? index} style={{ width: column.width }}>{column.title}</th>)}</tr></thead>
        <tbody>
          {loading && <tr><td colSpan={Math.max(1, columns.length)} className="ant-table-state">正在加载…</td></tr>}
          {!loading && rows.length === 0 && <tr><td colSpan={Math.max(1, columns.length)} className="ant-table-state">暂无数据</td></tr>}
          {!loading && rows.map((row, rowIndex) => {
            const key = typeof rowKey === "function" ? rowKey(row) : String(row[rowKey] ?? rowIndex);
            const rowProps = onRow?.(row, rowIndex) ?? {};
            return (
              <tr {...rowProps} key={key} className={`${rowProps.className ?? ""} ${rowClassName?.(row, rowIndex) ?? ""}`}>
                {columns.map((column, columnIndex) => {
                  const value = column.dataIndex ? row[column.dataIndex] : undefined;
                  return <td key={column.key ?? column.dataIndex ?? columnIndex}>{column.render ? column.render(value, row, rowIndex) : printable(value)}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {pagination !== false && dataSource.length > 0 && <div className="ant-table-pagination">1 / {Math.max(1, Math.ceil(dataSource.length / Math.max(1, pageSize)))} · {dataSource.length} records</div>}
    </div>
  );
}

export function Descriptions({ items = [], column = 3, bordered, size = "middle" }: {
  items?: Array<{ key?: string; label?: ReactNode; children?: ReactNode }>;
  column?: number;
  bordered?: boolean;
  size?: string;
}) {
  return (
    <dl className={`ant-descriptions ant-descriptions-${size} ${bordered ? "ant-descriptions-bordered" : ""}`} style={{ gridTemplateColumns: `repeat(${Math.max(1, column)}, minmax(0, 1fr))` }}>
      {items.map((item, index) => <div key={item.key ?? index}><dt>{item.label}</dt><dd>{item.children}</dd></div>)}
    </dl>
  );
}

export function Alert({ type = "info", showIcon, icon, message, description, className = "" }: {
  type?: "success" | "info" | "warning" | "error";
  showIcon?: boolean;
  icon?: ReactNode;
  message?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  const glyph = type === "success" ? "✓" : type === "error" ? "!" : type === "warning" ? "▲" : "i";
  return <div className={`ant-alert ant-alert-${type} ${className}`}>{showIcon && <span className="ant-alert-icon">{icon ?? glyph}</span>}<div><strong>{message}</strong>{description && <p>{description}</p>}</div></div>;
}

export function Skeleton({ paragraph }: { active?: boolean; paragraph?: { rows?: number } }) {
  return <div className="ant-skeleton">{Array.from({ length: (paragraph?.rows ?? 3) + 1 }, (_, index) => <i key={index} style={{ width: index === 0 ? "46%" : `${92 - (index % 3) * 12}%` }} />)}</div>;
}

export function Empty({ description = "暂无数据" }: { description?: ReactNode }) {
  return <div className="ant-empty"><span>◇</span><p>{description}</p></div>;
}

export function Result({ status, icon, title, subTitle, extra }: {
  status?: string;
  icon?: ReactNode;
  title?: ReactNode;
  subTitle?: ReactNode;
  extra?: ReactNode;
}) {
  return <div className={`ant-result ant-result-${status ?? "info"}`}><div className="ant-result-icon">{icon ?? (status === "error" ? "!" : "◇")}</div><h2>{title}</h2><p>{subTitle}</p><div>{extra}</div></div>;
}

type SegmentOption = string | number | { label: ReactNode; value: string | number };
export function Segmented({ options = [], value, defaultValue, onChange }: {
  options?: SegmentOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
}) {
  const [internal, setInternal] = useState(defaultValue ?? (typeof options[0] === "object" ? options[0]?.value : options[0]));
  const current = value ?? internal;
  return <div className="ant-segmented">{options.map((option) => { const item = typeof option === "object" ? option : { label: option, value: option }; return <button key={String(item.value)} className={current === item.value ? "active" : ""} onClick={() => { setInternal(item.value); onChange?.(item.value); }}>{item.label}</button>; })}</div>;
}

export function Tabs({ activeKey, defaultActiveKey, items = [], onChange }: {
  activeKey?: string;
  defaultActiveKey?: string;
  items?: Array<{ key: string; label: ReactNode; children: ReactNode }>;
  onChange?: (key: string) => void;
}) {
  const [internal, setInternal] = useState(defaultActiveKey ?? items[0]?.key);
  const current = activeKey ?? internal;
  const selected = items.find((item) => item.key === current) ?? items[0];
  return <div className="ant-tabs"><div className="ant-tabs-nav">{items.map((item) => <button key={item.key} className={selected?.key === item.key ? "active" : ""} onClick={() => { setInternal(item.key); onChange?.(item.key); }}>{item.label}</button>)}</div><div className="ant-tabs-content">{selected?.children}</div></div>;
}

export function Timeline({ items = [], mode }: {
  items?: Array<{ color?: string; label?: ReactNode; children?: ReactNode }>;
  mode?: string;
}) {
  return <ol className={`ant-timeline ant-timeline-${mode ?? "right"}`}>{items.map((item, index) => <li key={index}><span className="ant-timeline-dot" style={{ borderColor: item.color, backgroundColor: item.color }} /><div className="ant-timeline-label">{item.label}</div><div className="ant-timeline-content">{item.children}</div></li>)}</ol>;
}

function SearchInput({ defaultValue = "", onSearch, placeholder, allowClear: _allowClear, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { onSearch?: (value: string) => void; allowClear?: boolean }) {
  const [value, setValue] = useState(String(defaultValue));
  return <span className={`ant-input-search ${className}`}><input {...props} value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearch?.(value); }} /><button aria-label="搜索" onClick={() => onSearch?.(value)}>⌕</button></span>;
}

export const Input = { Search: SearchInput };

export const message = {
  useMessage() {
    const [text, setText] = useState("");
    const api = useMemo(() => ({
      info(value: string) { setText(value); window.setTimeout(() => setText(""), 3200); },
      success(value: string) { setText(value); window.setTimeout(() => setText(""), 3200); },
      error(value: string) { setText(value); window.setTimeout(() => setText(""), 3200); },
    }), []);
    const holder = text ? <div className="ant-message" role="status">{text}</div> : <Fragment />;
    return [api, holder] as const;
  },
};
