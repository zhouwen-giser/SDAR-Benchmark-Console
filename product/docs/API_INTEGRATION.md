# Benchmark Server HTTP Integration

## Source lock

- 单一合同：`api/benchmark-server.openapi.yaml`
- 来源：`zhouwen-giser/sdar-benchmark-server@900ee5f004b3ebb649ad775df8d0015a9575fed0`
- OpenAPI SHA-256：`6d7c46f4f85e9a8ce936bfa71d31dcd6909a6a2481ac490dbfb2623524569910`
- HTTP operation：105
- `api/benchmark-server.openapi.source-lock.json` 记录可复现同步信息。
- `pnpm api:generate` 是 `src/api/generated/` 的唯一生成入口；生成文件不手改。

## Runtime layers

```text
Generated OpenAPI Client / Schemas
  → BenchmarkApiTransport (relative base URL, timeout, abort, HTTP error)
  → LiveHttpConsoleApi (envelope and capability composition)
  → viewModelMappers (backend DTO → existing Chinese UI view model)
  → TanStack Query / Pages
```

浏览器仅请求 `/benchmark-api` 和可选的 `/telemetry-api`。不发送 Token/Cookie，不包含数据库凭据，也不直连 PostgreSQL/ClickHouse。

## Truthful states

`CapabilityMeta` 保留 `operationId`、`availability`、`reasonCodes`、`unavailableFields`、`warnings`、`watermark`、`projectionLagMs`、`contracts` 和 `generatedAt`。HTTP 失败直接进入 Error/Partial，绝不回退 Mock；`null` 不转换成 0/PASS。

Analytics capability 独立 Query；一个模块的 `BLOCKED_DATA` 或 503 不会让整个页面 first-failure。Evaluation Tab、Evidence records/timeline/graph/diff 和评价输入 Material 同样按需加载。

## Local HTTP development

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm api:generate
pnpm dev
```

Vite 将 `/benchmark-api/*` 代理到 `VITE_BENCHMARK_API_UPSTREAM`，并去掉前缀。默认上游为 `http://127.0.0.1:18090`。

## Internal deployment

```bash
cp .env.integration.example .env.integration
docker compose --env-file .env.integration -f docker-compose.integration.yml up --build -d
```

Console 地址为 `http://127.0.0.1:18091`。Nginx 保留 4xx/5xx、关闭 API buffering、为 SPA deep route 回退 `/index.html`。
