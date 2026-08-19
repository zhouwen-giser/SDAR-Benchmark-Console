# API Gap Report

## Baseline inventory

任务包目录 `api/api-catalog.json` 共 99 项：

| Status | Count | Meaning |
|---|---:|---|
| EXISTING | 8 | 当前 Server 已有且语义足够 |
| EXTEND | 15 | 路由存在，但字段、筛选或 typed view 不足 |
| NEW | 70 | Console 所需的新能力 |
| BLOCKED_DATA | 5 | 路由或 UI 可定义，但算法/Producer/正式数据不足 |
| EXTERNAL | 1 | Telemetry Platform 责任 |

P0 共 40 项：8 EXISTING、8 EXTEND、22 NEW、2 BLOCKED_DATA。

## UI runtime registry

当前页面直接展示 27 个能力元数据：1 EXISTING、4 EXTEND、19 NEW、2 BLOCKED_DATA、1 EXTERNAL。每个元数据包含 endpoint、source of truth、Mock、watermark、projection lag 与 availability reason。

## P0 integration order

| Order | Endpoint | Status | Required contract |
|---:|---|---|---|
| 1 | `GET /v1/dashboard/overview` | NEW | 一次返回单 Snapshot 的全部 Overview 模块、context、moduleErrors、watermark/lag |
| 2 | `GET /v1/context/options` | NEW | compatible Candidate/Baseline/Dataset/Profile/Run/filter options |
| 3 | `GET /v1/case-results` | NEW | Track/Risk/Gate/Metric/Readiness/Change/search/sort 的统一 Case Explorer |
| 4 | `GET /v1/benchmark-runs` | NEW | PG authority 状态与 CH projection 指标显式分离 |
| 5 | `GET /v1/benchmark-runs/{runId}/cases` | EXTEND | typed Case Matrix、Evaluation/Bundle refs、baseline delta |
| 6 | `GET /v1/comparisons/{comparisonId}` | EXTEND | typed identity、score/pass/verdict delta、blocker counts |
| 7 | `GET /v1/comparisons/{comparisonId}/cases` | EXTEND | changeType/gate/metric filters 与 Evidence refs |
| 8 | `GET /v1/evaluations/{evaluationId}` | EXTEND | readiness、F/HG/M、dimensions、findings、provenance typed view |
| 9 | `GET /v1/evaluations/{evaluationId}/metrics` | NEW | M1–M15 raw/weight/formalization/evidence level |
| 10 | `GET /v1/evidence-bundles/{bundleId}` | NEW | immutable identity、manifest、hash、family coverage、usage |
| 11 | `GET /v1/evidence-bundles/{bundleId}/timeline` | NEW | semantic ordered records 与 bounded record refs |
| 12 | `GET /v1/evidence-bundles/{bundleId}/diff` | NEW | record/relationship structural diff against baseline bundle |

## Extended workspace contracts

`console-api-extension.openapi.yaml` 当前共 28 个 operation，已成功生成 Fetch + React Query client；页面实际使用的扩展端点由手写 MSW handlers 和 `HttpConsoleApi` 契约测试覆盖。此结果证明前端合同可执行，不代表对应 Server capability 已实现。

| Endpoint | Status | UI behavior before backend delivery |
|---|---|---|
| `GET /v1/cases/{caseId}` | NEW | deterministic read-only Case Contract |
| `GET /v1/evaluations` | NEW | filterable typed collection |
| `GET /v1/evidence-bundles` | NEW | filterable immutable bundle catalog |
| `GET /v1/analytics/workspace` | NEW | reuses one watermarked Snapshot contract |
| `GET /v1/reports` | NEW | existing rows are Mock; new draft is session-local |
| `GET /v1/alerts` | NEW | existing rows are Mock; lifecycle mutations are session-local |
| `GET /v1/system/workspace` | NEW | service/contract/projection read-only overview |
| Candidate / Baseline / Dataset / Profile detail | NEW | read-only registry projections |

## Data blockers

- `score-distribution`：P50/P90 等正式汇总算法未冻结；当前 UI 仅以 `BLOCKED DATA + MOCK DATA` 演示，正式响应应允许 null。
- `operational` 与 run operational summary：若干自动 upstream Producer 缺失；Quality 与 Operational 不能混算。
- `skills`、`providers`：当前路由没有权威的 Run-scoped 自动汇总 Producer。
- Raw canonical trace 保持 `EXTERNAL`，由 Telemetry Query API 提供，Benchmark Server 不复制任意 trace search。

## Snapshot requirements

Overview、Run Dashboard、Compare 聚合必须返回一个 pinned watermark；局部模块失败通过 `partial + moduleErrors` 表达。PG authority 与 CH projection 混合响应必须暴露各自状态；Projection Pending 不返回 0。API 失败不把旧数据标记为实时。

## Mock mapping

本交付 Mock 来源均为任务包 JSON 或其显式 deterministic 派生：M1–M15 矩阵、Case Result 行与差异摘要均标记 `MOCK DATA`。默认 Adapter 不发明 Server 已实现状态。
