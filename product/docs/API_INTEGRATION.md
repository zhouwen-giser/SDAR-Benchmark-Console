# API Integration

## Adapter 模式

| 模式 | 用途 | 真实性 |
|---|---|---|
| `mock` | 默认演示、离线开发 | 所有页面标记 `MOCK DATA` |
| `msw` | 验证真实 HTTP 调用形状 | 浏览器拦截，仍标记 Mock |
| `http` | 对接 Benchmark Server | 不回退，不可用时进入 Error |
| `hybrid` | 分阶段接入 | 仅已实现的 Adapter 方法尝试真实 API，其余显式 Mock |

## OpenAPI / Orval

- `api/dashboard-overview.openapi.yaml`：统一 Overview Snapshot 合同。
- `api/console-api-extension.openapi.yaml`：Console 增量接口合同。
- `orval.config.ts`：生成 React Query client、schemas 与 Mock。
- `src/api/generated/`：运行 `pnpm api:generate` 后生成；生成文件不手改。
- 增量合同当前包含 28 个 operation；Orval 已生成 Fetch + React Query client、142 个 model 文件与可选 MSW mock handlers。
- 手写 `src/mocks/handlers.ts` 覆盖页面实际使用的 Overview、Runs、Cases、Comparisons、Evaluations、Evidence、Analytics、Reports、Alerts、System 与四类 Registry detail，并由 `consoleApi.http.test.ts` 验证 HTTP Adapter 映射。

## 查询参数映射

UI 使用 `risk`，HTTP Adapter 映射为 Server 合同中的 `riskLevel`。Candidate、Baseline、Dataset、Profile、Run、Track、Period 和状态均保留在 URL。

## 错误与水位

HTTP 非 2xx 直接抛出，由 TanStack Query 和页面状态处理。Server 响应必须携带一致水位；在异步 PG authority + CH projection 场景中，未完成投影返回 `null / partial / projection pending`，不得返回 0。

完整能力清单保留在 `api/api-catalog.json`（99 项）和 `api/api-matrix.csv`；实现优先级见 `reports/api-gap-report.md`。
