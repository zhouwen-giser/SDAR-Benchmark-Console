# SDAR Benchmark Console 内网 HTTP 接入报告

日期：2026-08-20  
Console 分支：`feature/live-http-benchmark-integration-v0.1`

## 合同锁定

- Benchmark Server：`feature/v0.1-console-api@900ee5f004b3ebb649ad775df8d0015a9575fed0`
- OpenAPI：105 operations
- SHA-256：`6d7c46f4f85e9a8ce936bfa71d31dcd6909a6a2481ac490dbfb2623524569910`
- Orval 输入仅为 `api/benchmark-server.openapi.yaml`；生成产物不包含 mock。
- `api:verify` 校验 operation count、合同哈希、必需路径和禁用原型路径。

## 已接入能力

- Overview：正式 Dashboard Snapshot，保留 availability、watermark、projection lag、contracts、reason codes；HTTP 参数不包含 scenario/dataState。
- Run / Case / Compare：使用正式列表、dashboard、repetitions、events、release gate、case contract/history/executions/stability 与 comparison 子资源组合。
- Evaluation：header 与 readiness、evidence grades、fatals、hard gates、metrics、dimensions、findings、evidence links、telemetry provenance 独立懒加载。
- Evaluation Input：snapshot 列表/详情、Domain/Provider material、显式确认 reconcile；原始 Trace 仅作外部诊断来源。
- Evidence：bundle、records、timeline、graph、diff、usage 独立加载。
- Analytics：18 个正式模块独立请求和 availability，单模块 503 不终止整页。
- Reports / Attention：真实 create/list/content/download 与 PATCH 状态持久化；Mock 模式才使用会话态。
- System：`/ready`、status、contracts、projections 使用 `allSettled` 聚合，保留可用控制面模块。
- HTTP 模式失败绝不回退 Mock；Hybrid 的每个资源明确标注 live 或 deterministic Mock 来源。

## 部署与代理

- Vite：`/benchmark-api` 代理至 `127.0.0.1:18090`。
- Nginx：SPA deep-route fallback；`/benchmark-api` 与 `/telemetry-api` 同源代理；默认发布端口 18091。
- Docker：Node 22 构建阶段 + Nginx runtime；无数据库或 ClickHouse 凭证进入浏览器 bundle。

## 验证结果

- `pnpm api:verify`：通过（105 operations 与固定 SHA-256）。
- `pnpm api:generate`：通过。
- `pnpm test`：通过；覆盖 envelope partial/null、provenance、400/404/409/503、HTTP 无回退和 Hybrid 来源标签。
- `pnpm build`：通过。
- Playwright live HTTP：Vite 与 Nginx 两套代理均为 5/5 通过；覆盖真实降级状态、Analytics 模块隔离、代理故障/恢复、deep-route refresh，以及 1920/1600/1440 桌面宽度。
- Nginx integration image：容器健康，18091 的 SPA 深路由返回 HTML；`/benchmark-api/health`、context/options、contracts 返回真实 JSON，`/benchmark-api/ready` 保留后端 503 JSON。
- PostgreSQL：真实执行 migrations 001–008；`/health` 返回 200。
- ClickHouse：本机 `127.0.0.1:8123` 连接拒绝，因此 `/ready`、Overview 与依赖分析投影的端点真实返回 503；Console 显示 PARTIAL/UNAVAILABLE，未注入事实表或伪造数据。

## 未完成的环境型验收

当前数据库没有正式 Run/Evaluation/Evidence/Report/Attention 业务记录，且 ClickHouse 不可达，因此无法诚实完成“动态选择首条真实 ID”的全链路下钻、真实报告创建/下载、Attention acknowledge/resolve，以及 Evaluation Input Domain/Provider material 的数据级验证。这些属于测试环境数据与 Telemetry/Projection 可用性阻塞，不代表正式 Benchmark release、80 Case Dataset、F/HG/M 冻结、三次 Baseline 或生产安全已完成。
