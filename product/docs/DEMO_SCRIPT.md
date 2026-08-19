# Nine-workflow Demo

## 1. HG KPI → Case Drawer

打开 BLOCKED Overview，点击 `Required HG Failure = 2`。右侧抽屉应显示 `HG4 失败 Case` 与 `MCP-RESTART-017`。

## 2. Track × Risk 交叉过滤

点击 `Track × Risk` 热力图中的 `core × critical`。URL 增加 `track=core&risk=critical`，顶部出现两个 Filter Chips；`Clear all` 仅清局部筛选。

## 3. Compare → New Gate Failure → Evaluation

打开 `/compare/CMP-20260815-004`，选择 `NEW GATE FAILURE (2)`，打开 `MCP-RESTART-017`，进入 typed Evaluation。

## 4. Evaluation → HG4 → Evidence Diff

在 Evaluation 中检查 Readiness、F1–F7、HG1–HG7、M1–M15 与五维。激活 HG4 行，进入 `bundle-cand-mcp17?tab=diff`，确认 `receipt-R1` 为 `REMOVED`，Verification 从 pass 变为 insufficient。

## 5. Snapshot 安全语义

在 Overview 状态选择器依次选择 `STALE` 与 `INVALID`。STALE 显示 Watermark 与 68s Lag 并保留旧值；INVALID 的 Quality Score 显示 `—`，瀑布等不具备正式意义的模块不渲染。

附加状态：LOADING 显示 12 个结构化 Skeleton；EMPTY、ERROR、PARTIAL 都有独立语义和恢复入口。

## 6. Case Contract → Evaluation → Evidence

从 `/cases/MCP-RESTART-017` 审阅 Preconditions、Actions、Expected Outcomes、Required Gates / Evidence 与三次执行绑定；点击 Evaluation，再进入 Evidence Bundle。

## 7. Evaluation / Evidence Collections

在 `/evaluations` 按 Track、Risk、Readiness、Verdict 和搜索过滤；在 `/evidence-bundles` 按状态与 Missing Family 过滤，并直接打开 Timeline 或 Diff。

## 8. Report / Alert 会话交互

在 Reports 创建发布评审草稿并预览/下载 JSON；在 Alerts 打开 Critical 告警并依次 Acknowledge、Resolve。两页均应持续显示 `SESSION-LOCAL`，刷新后不保留操作。

## 9. Context Resource Drill-down

从 Overview 的 Candidate / Baseline / Dataset / Profile 标签进入只读资源详情，再通过 Related Resources 返回 Run、Comparison 或 Explorer。
