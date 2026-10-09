# Latest ordinary Case evaluation Console integration

Verified on 2026-10-09. Scope: existing Console types, HTTP mapping, Evaluation List and Evaluation Detail. No Server/Simulator/archive changes, new APIs, scoring rules, Run, Move, Candidate, cancellation or reconciliation execution.

## Runtime and exact existing result

- Local Console: http://127.0.0.1:4173, `sdar-benchmark-console-dev.service`, PID 28647, active/running after the requested restart.
- Current same-origin API proxy: http://127.0.0.1:4173/benchmark-api → existing local Benchmark API http://127.0.0.1:18090. This task did not change startup overrides or remote deployment.
- Evaluation: `operational-evaluation-c9f51fafc9c3a4c6c1cd99ad8d7a9d3cf1c72367da9a845cc9830336df3ae52c`.
- Revision: 19, correlated with the Server's existing `reports/core001-observable-native10-v2.5/WORKER_HTTP_REPLAY_RECEIPT.json`.
- Result hash: `sha256:2138dd54174e489074c9486a4cc09f42c0554effbe921a34e5fa0154b834dcd5`.
- Case policy: `ugv-native-case-diagnostic/2`, hash `sha256:70c80c084cb3c11572da0bd97976f36e5bfab22f08c3b8e33a760763f8672bb5`.

Detail: http://127.0.0.1:4173/evaluations/operational-evaluation-c9f51fafc9c3a4c6c1cd99ad8d7a9d3cf1c72367da9a845cc9830336df3ae52c

## Implemented behavior

- Optional `caseDiagnosticEvaluation` v1/v2 passes unchanged through list, header and aggregated detail adapters. Absent/null old records retain the old path. Unsupported/malformed versions fail explicitly without Mock fallback.
- Case v2 is the primary ordinary Case view: score 100.0, coverage 100%, 8/8 decidable, 8 PASS, 0 FAIL, 0 UNKNOWN, 2 N/A, Case PASS.
- Historical policy/1 remains 100.0 / 25% / INCONCLUSIVE; no v2 quality fields or semantics are invented for it.
- `observedEvaluation` stays separate: evidence-aware/1, score 100.0, coverage 6% (3/50), only M1 scored. UNKNOWN metric scores remain em dashes.
- Candidate remains INCONCLUSIVE, formal qualification NOT_GRANTED, Case formalEligible=false, rankingPermitted=false. Case PASS does not establish Candidate physical success, strict scoring success or formal qualification.
- Server-owned rule results, counts and exact score/coverage fractions are displayed; no frontend scoring, denominator changes or quality multiplier was introduced.
- The ten-rule table exposes reasons, source scopes, clocks, expandable original references and missing paths. Evidence quality, 23 limitations and 17 missing proofs remain independently inspectable.
- The physical summary preserves observedEndState=true versus taskAchievedAtTerminal=null, Referee receipt time, configured-not-measured accuracy and same-origin mirror limitations.
- Actual PG-only detail has projectionStatus=pending and does not contain strict passed/qualityScore fields. They remain unavailable/null in the Console; Case PASS does not manufacture them. The underlying Server report's core.passed=false is not inferred into an absent HTTP field.
- Case IDs use the explicit Case result instead of the original episode subject ID when available.

## Verification

- Focused final command: `pnpm exec vitest run src/api/caseDiagnosticEvaluation.http.test.ts src/components/CaseDiagnosticEvaluationPanel.test.tsx src/pages/caseDiagnosticEvaluation.test.tsx src/api/observedEvaluation.http.test.ts src/components/ObservedEvaluationPanel.test.tsx src/utils/observedEvaluation.test.ts` — 6 files, 37/37 passed, exit 0.
- After fixing a test-only TypeScript option, `pnpm exec vitest run src/pages/caseDiagnosticEvaluation.test.tsx` — 4/4 passed, exit 0.
- `pnpm build` — TypeScript and production Vite build passed, exit 0. The existing large-chunk warning remains non-blocking; no unrelated bundle redesign was undertaken.
- `git diff --check` — passed.
- `node scripts/verify-case-diagnostic-http.mjs` — PASS. Four existing evaluation GETs and `/health` returned 200; complete Case objects match. List/detail M results match independently. Ancillary readiness/evidence resources need not contain the full M object. See `http-verification.json`.
- Real browser list: LIVE HTTP, exactly the selected existing Evaluation, Case 100.0 / 100% / PASS and M 100.0 / 6% in separate columns.
- Real browser detail: LIVE HTTP, v2 primary score/coverage/counts/verdict, Candidate INCONCLUSIVE, NOT_GRANTED, typed quality disclosure and the separate full M1–M15 region. The requested detail tab is kept available for manual inspection.

### Initial verification corrections

The first `pnpm test -- ...` invocation did not filter Vitest as intended and ran the larger local suite. New page tests exposed that global `vi.restoreAllMocks()` erased the shared matchMedia shim. Restoration was scoped to those tests' API spies, and only the six relevant files were rerun. An unsupported Testing Library `exact` option caused the first build's TypeScript failure; removing that test-only option resolved it. The initial read-only HTTP checker incorrectly required the full optional M result on ancillary resources; it was corrected to the actual API surface while retaining strict Case-object equality. No product verdict, evidence or backend gate was changed to pass these checks. A full-repository acceptance pass is not claimed.

## Modified implementation files

- `src/types.ts`
- `src/api/caseDiagnosticEvaluation.ts`
- `src/api/viewModelMappers.ts`
- `src/api/httpConsoleApi.ts`
- `src/api/consoleApi.ts`
- `src/mocks/extendedData.ts` (optional-field pass-through only; no new HTTP fallback)
- `src/utils/observedEvaluation.ts` (shared display formatting only)
- `src/components/CaseDiagnosticEvaluationPanel.tsx`
- `src/components/ObservedEvaluationPanel.tsx`
- `src/pages/EvaluationPage.tsx`
- `src/pages/EvaluationsPage.tsx`

Related tests, bounded historical/live test fixtures, this report and the GET-only checker were added. Existing dirty changes were preserved. OpenAPI and generated clients were not changed; the new field is an existing optional Server DTO extension, read at the view-model boundary.

## Remaining Server/environment status

The Server's global `/ready` remains reported as 503 because its existing ClickHouse query tunnel on 127.0.0.1:38123 is unavailable. The five local proxy GETs above passed independently. This Console task does not claim complete telemetry/deployment readiness, repair the tunnel, promote formal qualification or alter historical evidence. These conditions do not block inspection of the archived ordinary Case result.
