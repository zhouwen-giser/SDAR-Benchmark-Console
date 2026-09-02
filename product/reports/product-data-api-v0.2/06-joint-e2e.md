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

Server-owned 36-repetition regression, 72-repetition demo seed, real
ClickHouse outage/recovery, Dataset 0.1 compatibility, and final Server commit
remain part of the shared K11/K12 acceptance report and are not reclassified by
this Console evidence.
