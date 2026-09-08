# Live-Native v0.3 Console M16 E2E

Status: complete for `SDAR_BENCHMARK_V0_3_OPERATIONAL_CONSOLE_COMPLETE`.

## Frozen locks

- Console branch: `feature/benchmark-operational-console-v0.3`
- Console boundary commit:
  `2f5e467cfb2d9a0cd78a191964e0c86d7e338625`
- Console final implementation commit:
  `f98b8e77750fedc594770ed1bc24ed8e10d71ed0`
- Server final report commit:
  `312e627bd8818b756f14f71d3172aed07284895f`
- Server endpoint: `http://127.0.0.1:18094`
- OpenAPI SHA-256:
  `335c50caea64b9ac6aa0aac69c143d73ee802955715ab79218f6f9801b8b81a3`
- OpenAPI operations / unique operationIds / Server routes: `172 / 172 / 172`

## Console verification

Observed on 2026-09-05 against the final frozen API contract:

- `pnpm check`: PASS.
  - API binding verified all 172 operations and the exact OpenAPI hash.
  - Generated client regeneration completed without a worktree delta.
  - Vitest: 15 files, 60 tests PASS.
  - Strict TypeScript and production build PASS.
- After the visual fix in `f98b8e7`, an HTTP-mode production build passed.
- `git diff --check`: PASS.

The only build advisory was the existing Vite chunk-size warning. It did not
affect functional acceptance and was not used to block delivery.

## Real HTTP Playwright

Only `tests/e2e/live-native-v0.3.spec.ts` was run. The live-native anchor spec,
unrelated product suites, and external physical actions were not run.

The first invocation passed 4/5 cases:

1. complete require-native policy selection and Server-only preflight gate;
2. PostgreSQL-backed topology, environment, and resource authority;
3. explicit partial/unavailable Telemetry, Reconciliation, and Native
   Analytics states;
4. same-origin Console API boundary plus a typed, non-null SSE snapshot.

The fifth case correctly exposed that the standard operational reconciler was
not running: UI-created job `reconcile_6cdc8c063413df3f01c009ce` remained
`queued` for the 30-second assertion window. The assertion was not weakened.
Server resumed the standard reconciler and the same job completed in place at
`2026-09-05T03:24:10.640Z` with exactly two events:

- revision 1: `reconciliation.queued`;
- revision 2: `reconciliation.completed`.

All six requested scopes were `reread_completed`,
`physicalSideEffectCount=0`, and no Benchmark Run or Simulator operation was
created. Only that failed Playwright case was rerun. It passed 1/1 and created
`reconcile_5857bb5203ee30c622278d35`, which completed from revision 1 to 2 in
the same way with `physicalSideEffectCount=0`.

Across the initial invocation and the single focused rerun, every one of the
five v0.3 Console cases has a passing observation. HTTP mode showed no Fixture
fallback and browser traffic remained behind the Console `/benchmark-api`
boundary; the browser did not call Runtime, Provider, Telemetry, databases, or
`192.168.2.63` directly.

## Required widths

The final HTTP-mode build was visually inspected in the in-app browser:

| Width | Surface | Result |
| --- | --- | --- |
| 1920 × 1080 | Environment detail | PASS; external read-only notice and reason code visible, no horizontal overflow, no Fixture badge. |
| 1600 × 900 | Run Create v3 | PASS; Server preflight boundary visible, no horizontal overflow, no Fixture badge. |
| 1440 × 900 | System Topology | PASS; 15 components / 12 edges and readiness reason visible, collapsed navigation remains usable, no horizontal overflow. |

The 1920 check found that the compatibility CSS was collapsing Ant Design's
bordered description table to min-content width. Commit `f98b8e7` scopes a
display override to the Environment detail table; the final measured table and
view widths were 1707 px and 1709 px respectively.

## Boundary and non-claims

External Simulator source, image, deployment, and configuration remain
read-only. The Console presents this as provenance; Server `canCreateRun`,
`canExecuteRun`, and native selections remain the only execution gate. The
create/rerun gate stayed closed throughout M16.

This report does not claim a qualifying four-anchor Run, Formal Score,
Baseline, Release Gate PASS, production safety, the live-native vertical
marker, or overall v0.3 completion.

`SDAR_BENCHMARK_V0_3_OPERATIONAL_CONSOLE_COMPLETE`
