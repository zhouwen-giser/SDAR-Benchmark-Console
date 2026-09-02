# Product Data API v0.2 — Joint E2E Evidence (Console)

## Runtime

- Benchmark API: `http://127.0.0.1:18094`, `active-diagnostic`.
- Console uses same-origin `/benchmark-api`; HTTP mode has no Mock fallback.
- Standard benchmark workers: two; PostgreSQL is Run authority; Benchmark-owned
  ClickHouse is the analytics projection.
- Development environment reference: `simulator:192.168.2.63`; execution target
  is simulated and performs no live navigation mutation.

## Dynamic Console workflow

The full Playwright suite discovered the catalog at runtime, selected and
reordered three of the 12 Dataset 0.2 cases, changed repeat count to one,
preflighted, created a Run, and waited on the returned dynamic Run ID.

- Parent Run: `run_ee9b7803e4329782bc1a138168d39b4ce20f182b5569e1131e79f3ba9538db19`.
- Result: `3/3` terminal, 12 typed artifacts, 3 explicit substitutions.
- Boundary: `formalEligible=false`, `score=null`,
  `releaseGate=unavailable`.

The rerun UI selected one case and created a new immutable child through the
rerun API. The browser verified parent/child navigation, parent counts remained
`3/3`, and the child reached `1/1` terminal.

- Child Run: `run_1707774f3c04c42bba1a2390bd6137f93eefb50352dbc718b3e0c89426f240b8`.
- Result: `1/1` terminal, 4 typed artifacts, 1 explicit substitution.
- The Artifact Viewer opened an ID discovered from that child Run and verified
  metadata/content ownership, numeric size, exact UTF-8 byte length, and
  SHA-256 before rendering JSON.

## Analytics, completeness, and resilience

- Diagnostic outcome and all module-specific Analytics views rendered without
  fabricated rows.
- Data Completeness returned and displayed `complete` for the current runtime.
- Formal score distribution returned zero observations, null percentiles, and
  `NO_FORMAL_SCORES`.
- The existing proxy-outage test proved an HTTP failure never activates Mock
  data and that restoring the route recovers the live API.
- Desktop layout checks passed at 1920, 1600, and 1440 widths.

## Commands

- `VITE_BENCHMARK_API_UPSTREAM=http://127.0.0.1:18094 pnpm test:e2e`:
  `8/8` PASS.
- `pnpm check`: Vitest `38/38` PASS; API generation/verification, strict
  TypeScript, and production Vite build PASS.

## Shared Server K11/K12 evidence

- Final Server lock:
  `98fde66a3772ae7622c8a0613113fae8f602a7c7`; OpenAPI SHA-256
  `0061c26ae29efea41ceee4686cd308fef6e58340beb92bd2ec3991f250fed4b4`,
  125/125 operations implemented.
- Regression Run
  `run_60d914e2507b9973f3227bc082610b4c5cf19cf6d05ebe0cf190738d33db2d4b`
  reached 36/36 terminal repetitions.
- Demo executed six Runs across three immutable candidate snapshots and reached
  72/72 terminal repetitions.
- The standard projector converged to 1,469 ClickHouse rows with 1,469 distinct
  Product identities and zero pending Product outbox rows. A controlled
  ClickHouse outage returned typed 503 only for projection-backed Analytics;
  PostgreSQL Run details and Artifact endpoints remained available, and
  recovery introduced no duplicates.
- Dataset 0.1 remained byte-for-byte unchanged and passed the legacy
  Server/standard-worker restart E2E. Worker restart also left the v0.2
  regression Run at exactly 36 repetitions with no duplicate authority rows.
- Server `pnpm verify` passed 656/656 unit and 65/65 contract tests plus build,
  14 migrations, generated assets, architecture, and OpenAPI checks. Focused
  real-PostgreSQL integration passed 11/11; live Skills and Providers responses
  passed Ajv 2020 validation against the frozen schemas.

All of this evidence remains Development-only: no Formal Score, Baseline,
Release Gate PASS, or live-native qualification is claimed.
