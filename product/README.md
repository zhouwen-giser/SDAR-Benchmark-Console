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

正式工程为本目录 `product`，不要使用仓库根目录的旧托管/Sites 启动命令。
默认配置 `.env` 仅含公开开发地址：HTTP 模式，Benchmark 代理到
`http://127.0.0.1:18090`（Observed Evaluation goal 的本地 Benchmark API），Telemetry 代理到 `http://17.26.1.20:28081`。
开发与 build/preview 使用相同配置；`.env.test` 为离线测试显式选择 Mock。
不要向这些受版本管理的文件添加凭据。

```bash
pnpm install
pnpm api:generate
pnpm dev
```

浏览器打开 Vite 输出的地址。默认路由为 `/overview`。

本机调试入口为 `http://127.0.0.1:4173/overview`，热更新服务：

```bash
systemctl --user status sdar-benchmark-console-dev.service
systemctl --user start sdar-benchmark-console-dev.service
systemctl --user restart sdar-benchmark-console-dev.service
systemctl --user stop sdar-benchmark-console-dev.service
```

该服务为当前用户会话的 transient unit；unit 已回收或重启主机后可在本目录运行
`pnpm dev --host 127.0.0.1`。服务占用 4173 时不要再启动第二个进程。
修改代理地址后必须重启 Vite，不只刷新浏览器。

环境变量：

```bash
cp .env.example .env.local
```

覆盖优先级为进程环境变量 > `.env.local` > 项目 `.env` 默认值。例如切回 sz-gowm 后端，
在不受版本管理的 `.env.local` 中设置：

```dotenv
VITE_BENCHMARK_API_UPSTREAM=http://17.26.1.20:38090
VITE_TELEMETRY_QUERY_UPSTREAM=http://17.26.1.20:28081
```

HTTP 上下文优先使用 URL 显式选择，再使用 Server defaults；目录为空时不使用
示例 Candidate/Run。URL 身份参数为空表示用户已清空，不会重新应用默认值。
历史 URL ID 不因目录未列出而被替换。上下文失败可重试，不阻断其他模块读取。

手工测试先检查 `/benchmark-api/health` 与 `/telemetry-api/health`，再打开总览
和 `/runs/new`。创建页“刷新执行配置”只重新读取模板、目录、环境和资源；预检与
创建仍须手工点击。`active` 不会自动初始化 preset、Candidate、Dataset 或环境
注册表；这些缺失以及 Server 503 保留真实提示，不回退 Mock，也不解除预检门。

不保存覆盖文件时，也可直接运行：

```bash
VITE_BENCHMARK_API_UPSTREAM=http://17.26.1.20:38090 pnpm dev --host 127.0.0.1
```

Playwright 的 build/preview 沿用同一默认值及覆盖规则，不再强制指定旧本地地址。
离线单元测试使用 `.env.test` 的 Mock；HTTP 单元测试显式使用 MSW 拦截。
离线浏览器用例必须显式指定 Mock/MSW 模式，并只选离线用例；不要复用正在运行的 HTTP 服务，
也不要把现有真实 HTTP/Run 联调用例当作离线测试运行。
远程调试的聚焦验证命令：

```bash
node --test scripts/remote-config.test.mjs
pnpm exec vitest run src/hooks/remoteDebug.test.tsx src/hooks/useAnalysisContext.http.test.tsx src/api/consoleApi.http.test.ts src/pages/RunCreatePage.test.ts
pnpm build
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
