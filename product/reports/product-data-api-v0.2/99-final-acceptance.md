# Product Data and API v0.2 Final Acceptance

## Decision

PASS for the Development Product Data/API v0.2 scope.

## Source locks and contract hashes

- Server stacked base:
  `codex/ugv-four-case-diagnostic-vertical-v0.1@1d91138b56eb70e4edebe4c72fd0a824820ccf87`.
- Server final lock:
  `feature/benchmark-product-data-api-v0.2@98fde66a3772ae7622c8a0613113fae8f602a7c7`;
  Draft PR #5 remains open and stacked on the Development Vertical branch.
- Console implementation/E2E lock:
  `feature/benchmark-console-product-data-api-v0.2@3c030249f46044e8c914ae94324414e9adef92be`;
  Draft PR #2 remains open and stacked on
  `feature/benchmark-control-ugv-diagnostic-v0.1`.
- OpenAPI SHA-256:
  `0061c26ae29efea41ceee4686cd308fef6e58340beb92bd2ec3991f250fed4b4`.
- Server routes, OpenAPI operations, unique operation IDs, and generated Console
  operations: 125/125.

## Dataset 0.2

- Exactly 12 Cases across node-control, core, mcp-task, and cross-chain; three
  Cases per track.
- Dataset hash:
  `sha256:b212fac3e1b36aed788f5c380ffc799d8a1be00abfaf7445a3e7bd6f5bc29081`.
- All immutable bundles, refs, hashes, capability requirements, data-field
  coverage, strategies, and provenance passed generation and validation.
- Dataset 0.1 is byte-for-byte unchanged from the stacked base and its legacy
  Server/standard-worker restart E2E passes.

## API coverage

- Existing operations retained: 114.
- Additive Product v0.2 operations: 11.
- Final operations: 125.
- Partial/blocked or contract-only implementations: 0.
- Typed Evaluation, Artifact, timeline, substitution, completeness, rerun, and
  Analytics resources distinguish available, partial, unavailable, null, and
  zero values without fabricated success data.

## Seed profiles

- Minimal: one candidate, one Run, 12 Cases, repeat 1.
- Regression: one candidate, one Run, 12 Cases, repeat 3; 36/36 terminal.
- Demo: three candidates, two Runs each; 72/72 terminal.

## Projection

PostgreSQL remains Run, registry, and Evaluation authority; ArtifactStore
remains content authority. The standard projector drains the durable Product
outbox into the Benchmark-owned ClickHouse projection. The accepted snapshot is
1,469 rows and 1,469 distinct Product identities with zero pending Product
outbox rows. Controlled ClickHouse outage/recovery preserved PostgreSQL and
Artifact availability, returned typed 503 for affected Analytics, and recovered
without duplicate projection identities.

## Console

The Console is generated from the exact 125-operation frozen contract. It
discovers presets, datasets, candidates, and Cases dynamically; supports ordered
subsets and repeat counts; creates and reruns immutable Runs; and renders typed
timeline, substitution, Evaluation, Artifact, Analytics, and completeness
views. HTTP failures never fall back to Mock data.

Console verification passed:

- `pnpm check`: API generation/verification, Vitest 38/38, strict TypeScript,
  and production build.
- Live HTTP Playwright against `http://127.0.0.1:18094`: 8/8, including custom
  three-Case creation, child rerun, Artifact SHA-256/UTF-8 size verification,
  typed Analytics/completeness, `NO_FORMAL_SCORES`, proxy outage/recovery, and
  1920/1600/1440 responsive layouts.

## Joint E2E

- Console parent
  `run_ee9b7803e4329782bc1a138168d39b4ce20f182b5569e1131e79f3ba9538db19`:
  3/3 terminal.
- Console rerun child
  `run_1707774f3c04c42bba1a2390bd6137f93eefb50352dbc718b3e0c89426f240b8`:
  1/1 terminal; parent unchanged.
- Server regression
  `run_60d914e2507b9973f3227bc082610b4c5cf19cf6d05ebe0cf190738d33db2d4b`:
  36/36 terminal; restart produced no duplicates.
- Six Demo Runs across three immutable candidates: 72/72 terminal.
- Server `pnpm verify`: 656/656 unit, 65/65 contract, build, 14 migrations,
  generated assets, architecture, and OpenAPI PASS.
- Focused real-PostgreSQL integration: 11/11 PASS. Live Skills and Providers
  payloads also validate against the final Ajv 2020 schemas.

## Explicit non-claims

- No Formal Score.
- No Baseline.
- No Release Gate PASS.
- No production/live-native qualification.
- All accepted Runs and substitutions remain Development-only with
  `formalEligible=false`, null score, and unavailable release gate.

## Completion marker

SDAR_BENCHMARK_PRODUCT_DATA_API_V0_2_COMPLETE
