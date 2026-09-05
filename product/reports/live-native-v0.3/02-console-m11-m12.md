# Live-Native v0.3 Console M11/M12

## Source locks

- Console branch: `feature/benchmark-operational-console-v0.3`
- Console boundary implementation:
  `2f5e467cfb2d9a0cd78a191964e0c86d7e338625`
- Latest Console implementation:
  `f98b8e77750fedc594770ed1bc24ed8e10d71ed0`
- Server contract: `feature/benchmark-live-native-operations-v0.3@e328b09204447e9f9ab367171b30e8a79efe8ccd`
- Server M4-M10 implementation: `c30d8b2a8ae9e3323a2ef59656ff1f1b196d77ce`
- Server authority/runtime regression batch: `62b48fbf890860b287cba9087a0827456c0f21ca`
- Server existing-contract implementation:
  `39ab56dc71fe3e1c66a4e28025741b17601c3c29`
- Server final acceptance report:
  `312e627bd8818b756f14f71d3172aed07284895f`
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

- `pnpm check`: PASS; 13 Vitest files and 54 tests PASS, strict TypeScript and
  production build PASS.
- Full real HTTP Playwright: `14/14` PASS. This includes the existing v0.2
  create/rerun/artifact/analytics/completeness regression and all v0.3
  operational browser cases.
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
- Final v0.2 regression parent
  `run_601cb117eac22a6d5895c32fb4d19fa47b912f4e1ca96ff73955b4806b25f3fa`
  reached `completed_with_substitutions` with 3/3 cases. Immutable child
  `run_a80d4b9154a76b2b3bfc56db1b610683e6437de7a2659159dd0688984ab27945`
  reached the same authority terminal state with 1/1 case. Both remain
  `formalEligible=false`, `qualityScore=null`, and `releaseGate=unavailable`.
- Final UI-created reconcile `reconcile_4c038fbc8d93e739b270f669` reached
  `completed`; its authority read materialized one Run snapshot and 12
  Repetition snapshots, with `physicalSideEffectCount=0` and no reason codes.
- UI-G05 is covered: selecting `live_native` atomically selects
  `require_native`, `require_full`, `require_source_observed_at`, automatic
  reconciliation, SSE, and disables Development substitutions in the visible
  policy summary.

## Final boundary clarification

- The 18094 compatibility preset alias and preflight/create parser parity are
  restored. The five optional frozen Create fields are accepted without OpenAPI
  drift; dynamic Console create and rerun both pass.
- External Simulator source, image, deployment, and configuration are read-only.
  That boundary is displayed by the Console but does not override runtime
  availability and does not disable a policy that Server preflight admits.
- The final task-owned XCHAIN harness failed before Provider dispatch because
  Runtime Provider Binding authority did not match the admitted Capability;
  Telemetry simultaneously entered an ENOSPC write-failed latch. The attempt
  created no Benchmark Run, Provider Task/Execution/Mission, navigation, or
  Simulator control command. No retry was made.
- Existing simulated Product v0.2 Runs remain diagnostic history only.

## Marker eligibility

The four task-package results are independent. M11/M12 plus final M16 Console
verification make `SDAR_BENCHMARK_V0_3_OPERATIONAL_CONSOLE_COMPLETE` eligible;
the Server independently records Operational API and Native Software Ready.
The environment window does not qualify the four-anchor marker, so the joint
delivery records `SDAR_BENCHMARK_V0_3_LIVE_NATIVE_EXECUTION_PENDING_ENVIRONMENT`
and does not emit `SDAR_BENCHMARK_V0_3_LIVE_NATIVE_VERTICAL_COMPLETE` or
`SDAR_BENCHMARK_V0_3_COMPLETE`.
