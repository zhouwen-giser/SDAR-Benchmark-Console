# Phase 0 来源审计

审计时间：2026-08-15  
任务包：`SDAR_Benchmark_Console_Work_Mode_Design_Task_Package_v0.2`  
Server Source Lock：`feature/v0.1-benchmark-server@ee7f73735595382072b8205b891af554e8496582`

## 1. 审计结论

任务包完整，可安全进入正式前端实现。产品语义、视觉基线、API 状态和 Mock 场景的主线一致：Console 是内部研发质量决策与证据下钻工具；首页只消费统一 Snapshot；缺失后端能力必须显式标注；INVALID/NR/null 不得转为 0；不建设鉴权、权限、租户、微前端、Widget Runtime 或通用 Design System。

实现采用冻结技术栈：React、TypeScript、Vite、Ant Design、ProComponents、ECharts、React Router、TanStack Query、OpenAPI/Orval、MSW、Vitest/RTL、Playwright、pnpm。

## 2. 来源优先级

| 冲突类型 | 采用来源 |
| --- | --- |
| 产品语义 | PRD > 页面规格 > 参考原型 |
| API 状态 | `api-catalog.json` > OpenAPI 草案 > Mock |
| 视觉尺寸 | `layout-1920x1080.json` > 图片估测 |
| 路由 | `WORK_MODE_MASTER_TASK.md` 与 `TASK.json` 的冻结路由 |

## 3. 已确认事实

- Console API 清单共 99 项：EXISTING 8、EXTEND 15、NEW 70、BLOCKED_DATA 5、EXTERNAL 1。
- 当前 Server 仅 25 个 operation；正式 ruleset、可运行 80-Case Dataset、Live Runtime→Telemetry→Benchmark E2E、三次可比较 formal baseline 仍被阻塞。
- Overview 主数据入口固定为 `GET /v1/dashboard/overview`，组件不得并发拼接多个水位。
- PostgreSQL 是命令/注册/运行权威，ClickHouse 是评价与分析投影，Evidence Bundle 正文来自不可变 Artifact，Raw Trace 由 Telemetry Query API 提供。
- 1920×1080 使用 136px Sidebar、12 列、16px 主区内边距、10px gap；1600×900 压缩；1440×900 重排并允许纵向滚动。

## 4. 不一致与处理决定

| 编号 | 发现 | 风险 | 实现决定 |
| --- | --- | --- | --- |
| SR-01 | Overview 规格一处使用 `/benchmark-runs/:runId`，Master/TASK 使用 `/runs/:runId` | 深链不一致 | 采用 `/runs/:runId`，保留兼容重定向。 |
| SR-02 | 静态参考原型使用 `#/evidence/:id`，冻结路由是 `/evidence-bundles/:bundleId` | 书签失效 | 正式工程采用 BrowserRouter 路由；增加 `/evidence/:id` 兼容重定向。 |
| SR-03 | URL 规格同时出现 `risk` 与 API 参数 `riskLevel` | 恢复上下文失败 | URL 固定用 `risk`，HTTP Adapter 映射为 `riskLevel`。 |
| SR-04 | 三个 Overview JSON 的 `snapshot` 缺少 OpenAPI 要求的 `dataStatus/moduleErrors` | 状态语义不完整 | Mock Adapter 在边界处补齐，不修改原始基线数据；来源仍标记 Mock。 |
| SR-05 | `metricHeatmap` 在三份 Overview Mock 中为空，但 P0 与视觉稿要求 M1–M15 | 首页缺模块 | 使用显式 `mock-derived` 固定数据补齐，并在 capability/source 元数据中标注，不冒充 Server。 |
| SR-06 | READY Mock 的趋势末点仍是 BLOCKED 场景的 86.4/91.2，和 KPI 92.6/96.3 不一致 | 误导趋势 | Adapter 按当前场景校准趋势最后一点；记录为 Mock 修正。 |
| SR-07 | INVALID Mock 保留若干质量图数据，但正式 Quality/Pass 为 null | 可能伪造正式结论 | INVALID 时隐藏/降级正式分数、瀑布和分布；仅展示数据就绪、系统和可解释的历史上下文。 |
| SR-08 | Score Distribution 为 BLOCKED_DATA，但 Mock 给出 P10/P25/Median/P75/P90 | 算法未冻结却被视为正式 | 卡片显示 `BLOCKED_DATA · MOCK` 与“非正式 UI 示例”，不作为 Release Gate 输入。 |
| SR-09 | Operational API 为 BLOCKED_DATA/partial，但 Mock 有完整数值 | 上游 Producer 未具备 | 显示 `BLOCKED_DATA · MOCK/PARTIAL`，固定标注“不影响 Quality Score”。 |
| SR-10 | P1 Cases 可占位，但 P0 演示要求 HG→Case→Evaluation | 工作流无法闭环 | 实现轻量 Case Explorer 页面/抽屉，详情保持 P1 范围，不建设编辑能力。 |
| SR-11 | OpenAPI 多数业务结构仍是宽泛 `object` | 生成类型价值有限 | Orval 继续生成基线 client；业务 Adapter 使用独立严格类型，并在 API Gap 报告反馈强类型缺口。 |
| SR-12 | Prototype 使用手写 SVG/CSS 图表 | 不符合冻结图表栈 | 正式工程全部复杂图表改用 ECharts，原型仅作视觉参考。 |

## 5. 实施边界

### P0 完整实现

- Overview、Runs、Run Detail、Compare、Evaluation Detail、Evidence Explorer。
- BLOCKED/READY/INVALID；loading/empty/error/stale/partial。
- Release Gate、KPI、结论、关注队列、趋势、瀑布、Track×Risk、M1–M15、Evidence Funnel、稳定性、回归贡献、Score 分布、异常、Operational、系统状态、Recent Runs。
- URL 上下文、交叉过滤、Case Drawer、Evidence Diff、Mock/HTTP/Hybrid Adapter。

### P1 设计或轻量占位

- 初始交付决策为 Cases 只读 Explorer、其余 P1 占位；后续增强已完成 Case Detail、Candidate/Baseline/Dataset/Profile Detail、Analytics、Reports、Alerts、Settings，写操作仍严格保持会话级或只读边界。
- 占位页面不显示假业务数字。

### 明确不做

- 不修改 Server；不连接数据库；不提供任意 SQL。
- 不实现登录、RBAC/ABAC、用户、租户、组织、权限菜单。
- 不引入 Redux/Zustand、微前端、插件系统、Dashboard DSL 或独立 Design System 平台。

## 6. 验收基线

后续阶段以任务包 `docs/13_TEST_AND_ACCEPTANCE.md` 和 Master 第十二节为准，并额外验证：

1. Overview 所有模块共享一个 `snapshotId/watermark`；
2. Mock/EXTEND/NEW/BLOCKED_DATA/EXTERNAL 在 UI 可追溯；
3. INVALID 正式分数显示为 `—`；
4. 从“新增 HG4 失败”到缺失 Receipt Evidence Diff 不超过 3 次点击；
5. 生产构建、单元/组件测试、关键 E2E、三分辨率截图和交付清单全部有实证。
