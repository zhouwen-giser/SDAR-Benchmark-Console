# SDAR Benchmark Console

面向内部研发团队的 Benchmark 质量决策、回归定位与 Evidence 分析工作台。当前交付覆盖完整 P0，并把原 P1 范围扩展为可用的只读/会话级工作区：Case Detail、Evaluation / Evidence collections、Analytics、Reports、Alerts、Settings，以及 Candidate / Baseline / Dataset / Profile 详情。

## 目录

- `product/`：任务指定的正式 React + TypeScript + Vite 工程、OpenAPI、Mock、测试、报告和静态预览构建。
- `app/`：ChatGPT Sites 托管薄壳，直接复用 `product/src/App.tsx`。
- `vendor/`：Sites 托管薄壳使用的预览兼容层；正式 `product/` 工程使用真实 Ant Design、ProComponents、ECharts、TanStack Query 与 React Router 依赖。
- `product/dist/`：真实依赖生成的正式 Vite 构建；`product/dist-preview/` 保留为 Sites 兼容预览产物。

## 已验证命令

在仓库根目录：

```bash
npm test
npm run validate:artifact
./node_modules/.bin/tsc -p tsconfig.preview.json --noEmit
cd product && pnpm check
cd product && pnpm exec playwright test --list
```

正式工程：

```bash
cd product
pnpm install
pnpm api:generate
pnpm dev
pnpm check
pnpm test:e2e
pnpm screenshots
```

默认使用 `VITE_API_MODE=mock`。可切换 `http`、`hybrid` 或 `msw`，详见 `product/docs/API_INTEGRATION.md`。

## 关键演示

从 Overview 点击“新增 2 个 HG4 失败”，进入过滤后的 Case Explorer，打开 `MCP-RESTART-017` Case Contract 与 Evaluation，再由 HG4 或 Evidence 链接进入 Evidence Diff，即可定位 Candidate 缺失的 `receipt-R1`。

Reports 草稿与 Alerts 的 Acknowledge / Resolve 明确为 session-local，不伪装成后端持久化；资源详情保持只读，不扩张为 Registry 管理平台。

正式依赖、锁文件、Orval 生成代码、21 项 Vitest/RTL/MSW 测试与 Vite production build 已在当前环境验证。完整交付状态、剩余环境限制和复现证据见 `product/reports/acceptance-report.md`。
