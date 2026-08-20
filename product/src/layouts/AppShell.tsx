import { useState, type ReactNode } from "react";
import { Button, Tooltip } from "antd";
import {
  AlertOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  LeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RadarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { NavLink, useLocation } from "react-router-dom";
import { MockCornerBadge } from "../components/common";
import { currentApiMode } from "../api/consoleApi";

const navigation = [
  { path: "/overview", label: "总览", icon: FundProjectionScreenOutlined },
  { path: "/runs", label: "评测运行", icon: ExperimentOutlined },
  { path: "/cases", label: "测试用例", icon: FileTextOutlined },
  { path: "/evaluations", label: "评价结果", icon: RadarChartOutlined },
  { path: "/evidence-bundles", label: "证据浏览", icon: AreaChartOutlined },
  { path: "/analytics", label: "指标中心", icon: BarChartOutlined },
  { path: "/reports", label: "报告中心", icon: FileTextOutlined },
  { path: "/alerts", label: "关注队列", icon: AlertOutlined },
  { path: "/settings", label: "设置中心", icon: SettingOutlined },
];

function isActive(pathname: string, itemPath: string) {
  if (itemPath === "/evaluations") return pathname.startsWith("/evaluations");
  if (itemPath === "/evidence-bundles") return pathname.startsWith("/evidence-bundles");
  if (itemPath === "/runs") return pathname.startsWith("/runs") || pathname.startsWith("/compare");
  return pathname === itemPath;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const mode = currentApiMode();

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
          </span>
          {!collapsed && (
            <span className="brand-copy">
              SDAR
              <small>质量评测</small>
            </span>
          )}
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.path}
                to={{ pathname: item.path, search: location.search }}
                className={isActive(location.pathname, item.path) ? "active" : ""}
                aria-label={item.label}
              >
                <Icon />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
            return collapsed ? (
              <Tooltip key={item.path} title={item.label} placement="right">
                {link}
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {!collapsed && "收起"}
          </Button>
        </div>
      </aside>
      <main className="app-main">
        <div className="desktop-width-notice">
          <LeftOutlined /> 推荐使用 1440px 以上桌面分辨率
        </div>
        {children}
      </main>
      {mode !== "http" && <MockCornerBadge />}
    </div>
  );
}
