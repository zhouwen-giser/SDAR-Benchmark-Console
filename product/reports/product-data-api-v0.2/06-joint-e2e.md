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

- Parent Run: `run_36a355fa49f6188c2117ab3ab09f5602abaaa218de0134ba6e53a6c846fa26f3`.
- Result: `3/3` terminal, 12 typed artifacts, 3 explicit substitutions.
- Boundary: `formalEligible=false`, `score=null`,
  `releaseGate=unavailable`.

The rerun UI selected one case and created a new immutable child through the
rerun API. The browser verified parent/child navigation, parent counts remained
`3/3`, and the child reached `1/1` terminal.

- Child Run: `run_403ba0cfd99b8b4297f0500c39155d7e3e8412a2af5bac4a3c0efa7cdbcccd96`.
- Result: `1/1` terminal, 4 typed artifacts, 1 explicit substitution.
- The Artifact Viewer opened an ID discovered from that child Run and verified
  metadata/content ownership, numeric size, exact UTF-8 byte length, and
  SHA-256 before rendering JSON.

## Analytics, completeness, and resilience

- Diagnostic outcome and all module-specific Analytics views rendered without
  fabricated rows.
- Live HTTP assertions covered all 18 Analytics endpoints against the Goal
  Package minimum-field matrix and verified that every returned row exposes
  `evidenceRefs` or `reasonCodes`.
- Data Completeness returned and displayed `complete` for the current runtime;
  its exact section order is registry, run, projection, identity, artifact,
  formal.
- Formal score distribution returned zero observations, null percentiles, and
  `NO_FORMAL_SCORES`.
- The existing proxy-outage test proved an HTTP failure never activates Mock
  data and that restoring the route recovers the live API.
- Desktop layout checks passed at 1920, 1600, and 1440 widths.

## Commands

- `VITE_BENCHMARK_API_UPSTREAM=http://127.0.0.1:18094 pnpm test:e2e`:
  `9/9` PASS.
- `pnpm check`: Vitest `38/38` PASS; API generation/verification, strict
  TypeScript, and production Vite build PASS.

## Shared Server K11/K12 evidence

- Frozen Server functional lock:
  `67c912be57a587cc8a86bb03bc138d170be952ea`; OpenAPI SHA-256
  `92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15`,
  125/125 operations implemented. Final Server acceptance report commit:
  `09feee3d99a1e50e076e0178d603a700ed7b4730`.
- Regression Run
  `run_60d914e2507b9973f3227bc082610b4c5cf19cf6d05ebe0cf190738d33db2d4b`
  reached 36/36 terminal repetitions.
- Demo executed six Runs across three immutable candidate snapshots and reached
  72/72 terminal repetitions.
- The standard projector converged to 1,803 ClickHouse rows with 1,803 distinct
  Product identities/content hashes across 29 Runs and zero pending Product
  outbox rows. A controlled
  ClickHouse outage returned typed 503 only for projection-backed Analytics;
  PostgreSQL Run details and Artifact endpoints remained available, and
  recovery introduced no duplicates.
- Dataset 0.1 remained byte-for-byte unchanged and passed the legacy
  Server/standard-worker restart E2E. Worker restart also left the v0.2
  regression Run at exactly 36 repetitions with no duplicate authority rows.
- Server `pnpm verify` passed 657/657 unit and 67/67 contract tests plus build,
  14 migrations, generated assets, architecture, and OpenAPI checks. Real
  PostgreSQL integration passed 59 with 4 explicit skips; task-owned
  ClickHouse write coverage passed 8/8. Twenty-three live schema checks cover
  18 Analytics, six completeness sections, and four Evaluation resource types.
- Preflight/Create parity now rejects an unresolved contract release during
  preflight and accepts the exact immutable release ref; focused unit passed
  13/13 and real PostgreSQL Console integration passed 11/11.

All of this evidence remains Development-only: no Formal Score, Baseline,
Release Gate PASS, or live-native qualification is claimed.
