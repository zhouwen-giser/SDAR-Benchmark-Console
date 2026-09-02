# J0 Console Source Lock 与状态审计

日期：2026-09-02  
Goal：`sdar-benchmark-console-development-vertical-v0.1`

## Goal Package

- 文件：`SDAR_Benchmark_Console_Development_Vertical_Codex_Goal_Package_V1.0.zip`
- SHA-256：`005b4d156dc10c8eedd675cc6738a07fb73b359e392135594ff05a79bb24ba42`
- 包内校验：`TASK PACKAGE VALID`

## Console Source Lock

- Repository：`zhouwen-giser/SDAR-Benchmark-Console`
- Base branch：`feature/live-http-benchmark-integration-v0.1`
- Base/remote commit：`71c8de2f150a17a6ee78b61cbdff69e3b66246e2`
- Work branch：`feature/benchmark-control-ugv-diagnostic-v0.1`
- Drift：无；远端 base 仍指向 Goal Package 观察到的提交
- 初始工作树：clean

## Server Source Lock（联合只读复核）

- Repository：`zhouwen-giser/sdar-benchmark-server`
- Branch：`codex/ugv-four-case-diagnostic-vertical-v0.1`
- Local/remote commit：`f234bf63dd9a4ccf6293c860eac453b272fd64af`
- Draft PR：`#4`
- Drift：无；当前分支与 Goal Package 的 observed commit 一致
- 初始目标工作树：clean
- 其他既有 worktree/历史 P10 尝试不合并到本目标分支；其报告与数据库事实保持不变

## 初始合同与门禁

- 当前 Benchmark OpenAPI source lock：`feature/v0.1-console-api@900ee5f004b3ebb649ad775df8d0015a9575fed0`
- 当前 OpenAPI：105 operations，SHA-256 `6d7c46f4f85e9a8ce936bfa71d31dcd6909a6a2481ac490dbfb2623524569910`
- 基线 `pnpm check`：通过
- 基线测试：25/25 通过
- 基线生产构建：通过；现有单 bundle 大小告警保留为非阻塞项

## 现状与边界

- 已有真实 HTTP 读取、同源代理、Orval、ViewModel Mapper、Vitest 与 Playwright 基础。
- `createBenchmarkRun`、`getBenchmarkRunAuthorityStatus`、`cancelBenchmarkRun` 已存在于旧 OpenAPI 生成客户端，但尚未进入 `ConsoleApi` 控制面与 UI。
- Development preflight 与七项 UGV diagnostic 下钻合同等待 Server J1-J5 冻结后同步；不得手写重复 DTO。
- Console 只访问 Benchmark Server；不直连 Runtime、SMPP、Provider、Simulator、PostgreSQL 或 ClickHouse。
- 本任务不使用 Sites；继续使用仓库原生 `product/` Vite/React/pnpm 与内网 Docker/Nginx 集成路径。

## 联合会话

- Server 主会话：`01a056ad-8289-7b12-8423-e70e66082174`
- Server 会话负责 J0-J5 服务端工作，并已通知 SDAR Runtime、SMPP/Provider、Telemetry、Simulator/Referee 既有会话提供只读运行支持。
- 联调环境继续使用 `192.168.2.63`；在 Console 发起联合 E2E 前，不由支持会话创建 Task、导航或环境 mutation。

## J0 Exit

Console 与 Server Source Lock、分支/工作树归属及 Console 基线验证均已完成。Server 会话继续负责确认外部支持会话的运行态锁与后续 J1-J5 实现。
