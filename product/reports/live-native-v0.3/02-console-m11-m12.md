# Live-Native v0.3 Console M11/M12

## Source locks

- Console branch: `feature/benchmark-operational-console-v0.3`
- Latest pushed Console implementation: `e1904feab14e8a54e3b42aa8a22a997ed6a26a8e`
- Server contract: `feature/benchmark-live-native-operations-v0.3@e328b09204447e9f9ab367171b30e8a79efe8ccd`
- Server M4-M10 implementation: `c30d8b2a8ae9e3323a2ef59656ff1f1b196d77ce`
- OpenAPI SHA-256: `335c50caea64b9ac6aa0aac69c143d73ee802955715ab79218f6f9801b8b81a3`

## Implemented contracts and code

M11 provides typed System Topology, Environment list/detail, Resource
list/detail, and Overview v3 surfaces. M12 provides the live Run monitor,
resumable SSE client, Run/Repetition identity, trajectory, Telemetry workspace,
Reconciliation Center, native analytics, and Attention timeline/evidence.

The Console uses the generated 172-operation client models as wire types. HTTP
mode never falls back to Mock/Seed data. Development fixture data is visibly
classified as `development_fixture` and is not reachable as an HTTP fallback.

The Vite development/preview proxy now honors command-line
`VITE_BENCHMARK_API_UPSTREAM` before `.env` defaults. This is required for the
joint 18094 runtime and avoids silently sending Playwright to the historical
18090 endpoint.

## API operation count

- OpenAPI operations: `172`
- Unique operationIds: `172`
- Additive live-native operations: `47`
- Schemas: `326`
- Console verifier: PASS

## Tests and live probes

Observed at `2026-09-04T06:05:27.553Z` against
`http://127.0.0.1:18094`:

- `pnpm check`: PASS; 13 Vitest files and 53 tests PASS, strict TypeScript and
  production build PASS.
- Focused real HTTP Playwright: `9/9` PASS.
- Topology: 15 registry components and 12 edges rendered from PostgreSQL;
  compatibility rows render as typed values.
- Environment/resource: `ugv-simulator-dev` and `vehicle:ugv1` list/detail
  pages render immutable identity, fault profiles, capabilities, four time
  domains, and honest unresolved observation fields.
- Telemetry: four typed source rows render with partial/unavailable status; no
  status is inferred as ready.
- SSE: a snapshot frame returns `text/event-stream`, a non-null
  `RunStreamEvent`, and the requested Run identity. The Console sends
  `Last-Event-ID`, deduplicates events, bounds its buffer to 200, and repairs
  event/revision gaps by invalidating authoritative snapshots.
- Browser request audit: only the Console origin and its `/benchmark-api`
  boundary were contacted. No direct Runtime, SMPP, Telemetry, Provider,
  PostgreSQL, ClickHouse, or `192.168.2.63` browser traffic was observed.
- Run monitor: an existing terminal Run rendered Live Run Monitor, SSE delivery,
  identity, Telemetry, and Provider Closure v2 fields without a fixture fallback.
- Reconcile UI created `reconcile_91539c085878f92269b51b7a` with
  `sideEffectPolicy=no_new_physical_side_effect`; it appeared in the durable PG
  job list and reached `completed_partial`. Its result reports
  `physicalSideEffectCount=0`; the only reason codes are
  `RUN_NATIVE_SNAPSHOT_NOT_CAPTURED` and
  `REPETITION_NATIVE_SNAPSHOT_NOT_CAPTURED`. Durable event revisions are `1`
  (`reconciliation.queued`) and `2` (`reconciliation.completed_partial`).

## Remaining advisories

- The 18094 compatibility preset alias was restored with the exact long immutable
  contract release and `simulator:192.168.2.63` environment. Dynamic preflight
  then exposed a Server implementation mismatch: its strict request parser
  rejected the five optional v0.3 Create fields that are present in the frozen
  OpenAPI. Server has the exact traced request and is fixing preflight/create
  parity without contract drift.
- Provider/Telemetry readiness is partial/degraded. No M13/M14 native anchor,
  `substitutionCount=0`, or native software readiness is claimed here.
- Existing simulated Product v0.2 Runs remain diagnostic history only.

## Marker eligibility

M11 UI and the implemented portions of M12 are verified. The v0.3 completion
marker is not eligible until M13-M16 produce and verify the required live-native
anchors, recovery evidence, and final acceptance artifacts.
