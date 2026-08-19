import type { ReactNode } from "react";
import { Table, type TableColumn } from "./antd";

export type ProColumns<T> = TableColumn<T> & {
  copyable?: boolean;
  ellipsis?: boolean;
  valueType?: string;
};

type ProTableProps<T extends Record<string, any>> = {
  columns?: ProColumns<T>[];
  dataSource?: T[];
  rowKey?: string | ((row: T) => string);
  loading?: boolean;
  pagination?: false | { pageSize?: number; showSizeChanger?: boolean };
  scroll?: { x?: number | string; y?: number | string };
  rowClassName?: (row: T, index: number) => string;
  onRow?: (row: T, index: number) => Record<string, any>;
  search?: boolean;
  options?: boolean;
  toolBarRender?: boolean | (() => ReactNode[]);
};

export function ProTable<T extends Record<string, any>>(props: ProTableProps<T>) {
  return <Table<T> {...props} />;
}
