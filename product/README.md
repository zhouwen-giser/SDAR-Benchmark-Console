# Formal Frontend Project

这是 `sdar-benchmark-console` 的正式前端工程。业务代码不依赖托管壳，入口为 `src/main.tsx`；内网集成默认通过同源 `/benchmark-api` 访问真实 Benchmark Server。

## 技术栈

- React 19、TypeScript strict、Vite
- React Router、TanStack Query
- Ant Design 5、Ant Design ProComponents
- ECharts / echarts-for-react
- Orval + OpenAPI、MSW
- Vitest、Testing Library、Playwright
- pnpm

## 运行

```bash
pnpm install
pnpm api:generate
pnpm dev
```

浏览器打开 Vite 输出的地址。默认路由为 `/overview`。

环境变量：

```bash
cp .env.example .env.local
```

- `VITE_API_MODE=mock`：直接使用强类型 Mock Adapter，仅用于离线开发。
- `VITE_API_MODE=msw`：HTTP 调用由 MSW 拦截。
- `VITE_API_MODE=http`：调用 `VITE_BENCHMARK_API_BASE_URL`。
- `VITE_API_MODE=hybrid`：仅用于并行开发，每个 Mock capability 必须显示 `MOCK`。

## 校验

```bash
pnpm api:generate
pnpm test
pnpm build
pnpm test:e2e
pnpm screenshots
```

Playwright 用例包含 1920×1080 Overview 无滚动、1600 的 18 路由矩阵、1440 无横向溢出、三次下钻证据链、扩展工作区流程以及 STALE / INVALID 语义。截图脚本生成 23 张关键页面与状态图，覆盖 P0 与扩展工作区。

## 页面范围

- P0：Overview、Runs、Run Detail、Compare、Cases、Evaluation Detail、Evidence Explorer。
- 扩展：Case Detail、Evaluation Explorer、Evidence Bundle Browser、Analytics Workspace。
- HTTP 模式：Reports 与 Attention 生命周期由后端持久化；Mock 模式才使用会话级状态。
- 只读系统/资源：Settings & System、Candidate、Baseline、Dataset、Profile Detail。

## 数据真实性

每个页面通过 `CapabilityMeta` 展示 endpoint、`EXISTING / EXTEND / NEW / BLOCKED_DATA / EXTERNAL`、是否 Mock、Source of Truth、Watermark、Projection Lag 与不可用原因。缺数据用 `—`、`null`、NR 或 partial 表示，不用 0 冒充。

## 本次环境说明

当前环境已实际跑通 `pnpm check`（固定 OpenAPI 校验、Orval、25 项 Vitest/RTL/MSW、strict TypeScript 与 Vite production build）。Playwright 使用本机 Chrome 对 Vite 与 Nginx 的真实 HTTP 代理完成联调；覆盖 1920/1600/1440、deep-route refresh、模块级降级与代理故障恢复。数据级限制见 `reports/internal-http-integration-report.md`。
