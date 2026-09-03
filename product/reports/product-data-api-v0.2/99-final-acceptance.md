# Product Data and API v0.2 Final Acceptance

## Decision

PASS for the Console and shared functional gates. The completion marker remains
withheld only until the Server records this Console handoff in its final
report-only acceptance commit.

## Source locks and contract hashes

- Server stacked base:
  `codex/ugv-four-case-diagnostic-vertical-v0.1@1d91138b56eb70e4edebe4c72fd0a824820ccf87`.
- Server functional lock:
  `feature/benchmark-product-data-api-v0.2@67c912be57a587cc8a86bb03bc138d170be952ea`.
  Draft PR #5 remains open and stacked on the Development Vertical branch; its
  final report-only acceptance commit is pending this Console handoff.
- Console branch: `feature/benchmark-console-product-data-api-v0.2`; the final
  typed-contract/E2E commit is the commit containing this report. Draft PR #2
  remains open and stacked on
  `feature/benchmark-control-ugv-diagnostic-v0.1`.
- OpenAPI SHA-256:
  `92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15`.
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
- The Goal Package Analytics minimum-field matrix is satisfied for 18/18
  module-specific row schemas with `additionalProperties=false` and explicit
  evidence/reason provenance.
- K7 Fatal, Hard Gate, Metric, and Dimension DTOs share version, label, status,
  value, unit, expectation, reasons, evidence, data-class, and formalization
  fields.
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
- Live HTTP Playwright against `http://127.0.0.1:18094`: 9/9, including custom
  three-Case creation, child rerun, Artifact SHA-256/UTF-8 size verification,
  typed Analytics/completeness, `NO_FORMAL_SCORES`, proxy outage/recovery, and
  1920/1600/1440 responsive layouts, all 18 Analytics minimum-field assertions,
  and the exact six-section completeness assertion.

## Joint E2E

- Console parent
  `run_36a355fa49f6188c2117ab3ab09f5602abaaa218de0134ba6e53a6c846fa26f3`:
  3/3 terminal.
- Console rerun child
  `run_403ba0cfd99b8b4297f0500c39155d7e3e8412a2af5bac4a3c0efa7cdbcccd96`:
  1/1 terminal; parent unchanged.
- Server regression
  `run_60d914e2507b9973f3227bc082610b4c5cf19cf6d05ebe0cf190738d33db2d4b`:
  36/36 terminal; restart produced no duplicates.
- Six Demo Runs across three immutable candidates: 72/72 terminal.
- Server `pnpm verify`: 656/656 unit, 67/67 contract, build, 14 migrations,
  generated assets, architecture, and OpenAPI PASS.
- Real PostgreSQL integration: 58 PASS / 4 explicit skips. Task-owned
  ClickHouse writes: 8/8 PASS. Twenty-three live response validations cover all
  18 Analytics modules, six completeness sections, and four K7 Evaluation
  resource types against the frozen schemas.
- The post-validation preflight/create parity regression passed focused unit
  13/13 and real PostgreSQL Console integration 11/11 without OpenAPI drift.

## Explicit non-claims

- No Formal Score.
- No Baseline.
- No Release Gate PASS.
- No production/live-native qualification.
- All accepted Runs and substitutions remain Development-only with
  `formalEligible=false`, null score, and unavailable release gate.

## Completion marker

Withheld pending final requirement-by-requirement acceptance.
