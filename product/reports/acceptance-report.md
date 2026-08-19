# Acceptance Report

## Decision

**Frontend engineering baseline PASS / backend-integrated release pending.** 全部 P0 与扩展页面已实现；真实依赖安装、锁文件、Orval、Vitest/RTL/MSW、strict TypeScript、正式 Vite build、Sites build 与云端浏览器关键工作流均通过。剩余发布阻塞来自未交付的 Server 能力、`BLOCKED_DATA` 数据源，以及当前环境无法取得 Playwright Chromium 二进制。

## Automated evidence

| Check | Result | Evidence |
|---|---|---|
| pnpm install + lockfile | PASS | `pnpm-lock.yaml` 通过供应链策略并可重复安装 |
| Orval generation | PASS | 28 operations；Fetch + React Query client；142 model files |
| Vitest / RTL / MSW | PASS | 5 files、21 tests；包含真实 `HttpConsoleApi` + MSW 契约验证 |
| Formal `pnpm build` | PASS | strict TypeScript + Vite production build |
| Playwright specification discovery | PASS | 7 tests；覆盖 1920、1600 18 路由、1440 与关键流程 |
| Playwright browser execution | BLOCKED_ENV | Chromium 下载在当前网络策略下返回空包；runner 与测试源码正常 |
| Preview TypeScript | PASS | `tsc -p tsconfig.preview.json --noEmit` |
| Sites production build | PASS | `npm test`；Rendered HTML test 通过 |
| Sites artifact validation | PASS | ESM Worker `default.fetch` 与 hosting manifest 完整 |
| Cloud-browser route regression | PASS | 18/18 routes；0 render/404/横向溢出错误；1363×936 |
| Cloud-browser workflows | PASS | 三次下钻 Evidence、报告草稿、告警 Acknowledge/Resolve、设置重载持久化、Candidate 跳转 |

## Requirement matrix

| Requirement | Result | Notes |
|---|---|---|
| 1920×1080 Overview no page scroll | READY_TO_RUN | Playwright 断言已编译；精确执行等待 Chromium binary |
| 1600×900 usable | READY_TO_RUN | 18 路由矩阵已编译；云端更窄 1363px 实测无横向溢出 |
| 1440×900 no horizontal page overflow | PARTIAL_PASS | 精确规格已编译；云端 1363px 实测通过 |
| BLOCKED / READY / INVALID | PASS_BROWSER | 三态可见；INVALID Quality Score 为 `—` |
| loading / empty / error / stale / partial | PASS_BROWSER | loading Skeleton、stale watermark/lag、partial module error 均显式 |
| Key workflows | PASS_BROWSER | P0 下钻与扩展工作区会话流程均通过 |
| All charts data-driven | PASS_SOURCE_BROWSER | Overview/Analytics 图表均由 Snapshot 数据生成 |
| Missing backend capabilities marked | PASS | status + Mock + endpoint + SOT + watermark/lag/reason |
| API failure not shown as live | PASS_BROWSER | Error 替换内容；stale/partial 独立标记 |
| Evidence within three drill-downs | PASS_BROWSER | conclusion → filtered Cases → Evaluation → Evidence Diff |
| One-command runnable prototype | PASS | root `npm run dev`；formal `pnpm dev` |
| OpenAPI / generated client / MSW parity | PASS | 扩展页面端点已补齐并具备 HTTP Adapter 契约测试 |
| Required implementation screenshots | PARTIAL | Sites 已有真实缩略图；23-target Playwright capture 等待 Chromium binary |

## Defects found and fixed during QA

1. 真实 ECharts 类型发现 Heatmap metadata、Funnel tuple、Graphic align 与 Graph link 的宽泛类型；已改为合法严格类型并通过正式 build。
2. AntD 真实 DOM 同时把 `aria-label` 放在 Select 容器与输入，旧 RTL selector 产生重复匹配；改为 role-based selector。
3. Vitest 会误收集 `tests/e2e`；已限制为 `src/**/*.test.{ts,tsx}`。
4. HTTP Adapter 的 risk/gate/change 查询名与 Server 合同不一致；统一映射为 `riskLevel/gateId/changeType`，MSW 同时保持兼容读取。
5. Analytics HTTP 模式错误复用了 Overview endpoint；现改为 `/v1/analytics/workspace`。
6. Case Explorer 原本只能先进入 Case Detail，无法满足三次下钻 Evidence；新增每行直接 Evaluation 动作，同时保留 Case Detail。
7. Sites preview 会监听项目内 pnpm cache 并耗尽 watcher；Vite 已忽略 `.sites-runtime`、正式 `node_modules` 与 `dist`。

## Release gate

前端源代码与工程基线可以进入后端联调。正式集成发布前仍需：Server 按 NEW/EXTEND 合同交付能力、冻结 `BLOCKED_DATA` 算法/Producer、在具备 Chromium 的 CI 执行 7 项 Playwright 与 23 张截图、完成 axe 与真实 AntD 人工无障碍复核。任何 Server capability 状态不得因 Mock/MSW 通过而被重分类。
