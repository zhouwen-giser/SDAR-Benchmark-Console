# Development Vertical — J12 Final Acceptance

## Exact implementation locks

- Server: `1d91138b56eb70e4edebe4c72fd0a824820ccf87`
  (`codex/ugv-four-case-diagnostic-vertical-v0.1`, Draft PR #4)
- Console functional acceptance: `9f3310af9b566334b0be06e877be26244def25fa`
  (`feature/benchmark-control-ugv-diagnostic-v0.1`, Draft PR #1)
- Server OpenAPI SHA-256:
  `e6e675aa1245f7f4e530046a4cb03d6e890aabc37f60afb5372119191f32cd00`
- OpenAPI operations: `114`
- Goal Package SHA-256:
  `005b4d156dc10c8eedd675cc6738a07fb73b359e392135594ff05a79bb24ba42`

The Console source lock points to the final Server implementation commit. The
contract bytes are unchanged from the earlier J4 contract-freeze commit.

## Acceptance gates

- Server-discovered preset and side-effect-free preflight: PASS.
- `ready_with_substitutions` does not block Development create: PASS.
- Standard PostgreSQL Run Authority and `execution.benchmark_run` worker: PASS.
- Console create, authority monitor, direct repetition/event queries, cancel,
  and seven diagnostic resource categories: PASS.
- HTTP mode has no Mock fallback; upstream failure and recovery: PASS.
- Development boundary is fixed at `formalEligible=false`, `qualityScore=null`,
  and `releaseGate=unavailable`: PASS.
- Worker restart/no-duplicate and queued cancellation: PASS.
- Both repositories build and pass their applicable verification suites: PASS.

## Four-Case authoritative Run

- Run:
  `run_d733cdd641c8e727d40dab6194ee6dcf1091c4589e1fae6c4dc62553a57f3150`
- Terminal status: `completed_with_substitutions`
- NODE, CORE, MCP, XCHAIN: `4/4`, all repetition and terminal states
  `completed`
- PostgreSQL evidence: `31` Run events, `44` repetition events, `4` immutable
  evaluations, and `18` typed artifacts
- Qualification resource, external capability inventory, repetition detail,
  artifact inventory, execution trace, physical verification, and fault
  attribution: HTTP `200`

The Console created this Run from the Server preset and displayed its
PostgreSQL authority and all four diagnostic repetitions. ClickHouse projection
availability was not required to continue functional diagnosis.

## Recovery and cancellation

- Restart baseline
  `run_c8951de10ae106b17419299b04ecc23829bdfdb705c1f455f5c13b4ee1dbb000`
  retained identical `31/44/4/18` counts before and after worker restart.
- Focused PostgreSQL integration forced a mid-Run worker failure and proved
  exactly four Candidate submissions, with no fifth duplicate submission.
- Cancellation baseline
  `run_6085223c42f76e201d0885b8883bd21dfb9992ce344ddca8f97ec3b9c3014184`
  transitioned `queued -> cancelled`, retained
  `cancellationRequested=true`, and claimed zero Cases.
- During an API outage the Console showed an explicit typed failure, disabled
  create, rendered no Mock data, and recovered after the upstream returned.

## Development substitutions and honest limitations

- The accepted Run used seven explicit simulated Development substitutions.
- Historical P10 registry material is reference-only provenance.
- ClickHouse dashboard/evidence projection was unavailable for the accepted
  Run; PostgreSQL authority and typed artifacts remained available.
- The Run proves simulated Development functionality. It does not claim
  live-native navigation, formal qualification, a formal score, or Release
  Gate PASS.

These are visible non-functional or formalization gaps. Under the Goal Package
`substitute-and-continue` policy, they do not block feature development,
debugging, terminal Run completion, or artifact inspection.

## Verification

- Server `pnpm verify`: PASS; unit `645/645`, contract `65/65`, build,
  migrations, generated assets, architecture, OpenAPI, SBOM, and third-party
  inventories PASS. The no-DB invocation explicitly skipped `71` repository
  integration tests; focused real PostgreSQL server integration passed `2/2`.
- Console `pnpm check`: PASS; Vitest/RTL/MSW `29/29`, OpenAPI verification and
  generation, strict TypeScript, and production Vite build PASS.
- Console Playwright live HTTP suite: `5/5` PASS, including no-Mock proxy
  outage/recovery, deep-route refresh, and 1920/1600/1440 viewports.
- Interactive in-app browser verification: PASS for preset, preflight, create,
  four-Case monitor/diagnostics, truthful cancellation race, cancellation
  baseline, and API outage/recovery.

## Completion markers

- `SDAR_BENCHMARK_CONSOLE_CONTROL_DEV_INTEGRATED`
- `SDAR_BENCHMARK_UGV_DEVELOPMENT_VERTICAL_COMPLETE`
