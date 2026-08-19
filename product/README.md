# Formal Frontend Project

这是 `sdar-benchmark-console` 的正式前端工程。业务代码不依赖托管壳，入口为 `src/main.tsx`，默认使用高保真 Mock Adapter。

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

- `VITE_API_MODE=mock`：直接使用强类型 Mock Adapter，默认值。
- `VITE_API_MODE=msw`：HTTP 调用由 MSW 拦截。
- `VITE_API_MODE=http`：调用 `VITE_BENCHMARK_API_BASE_URL`。
- `VITE_API_MODE=hybrid`：当前仅尝试真实 Run Dashboard，失败后显式回退到 Mock。

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
- 会话级：Reports 草稿与 Alerts 生命周期，页面内明确标注不持久化。
- 只读系统/资源：Settings & System、Candidate、Baseline、Dataset、Profile Detail。

## 数据真实性

每个页面通过 `CapabilityMeta` 展示 endpoint、`EXISTING / EXTEND / NEW / BLOCKED_DATA / EXTERNAL`、是否 Mock、Source of Truth、Watermark、Projection Lag 与不可用原因。缺数据用 `—`、`null`、NR 或 partial 表示，不用 0 冒充。

## 本次环境说明

当前环境已完成真实 pnpm 依赖安装并提交锁文件；`pnpm check` 已实际跑通 Orval、21 项 Vitest/RTL/MSW 测试、strict TypeScript 与正式 Vite production build。Playwright runner 与 7 项 E2E 规格可被发现和编译，但其 Chromium 二进制下载被当前网络策略返回空包，因此精确 1920/1600/1440 的终端 Playwright 执行与 23 张截图仍待具备浏览器缓存的环境完成。Sites 云端预览已实测 18/18 路由与关键交互，视口为 1363×936。
