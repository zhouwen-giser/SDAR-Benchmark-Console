# Development Vertical — J9–J11 Joint E2E

## Execution policy

This joint run follows the Development rule from the Goal Package: functional
development and debugging continue through explicit substitutions. Historical
registry compatibility, projection completeness, and formal qualification are
recorded as gaps but do not block the Development workflow. Formal qualification
remains a separate strict path.

## Live deployment

- Benchmark API: `http://127.0.0.1:18090` (`0.0.0.0:18090` listener)
- Console: `http://127.0.0.1:4173`
- Simulator reference: `simulator:192.168.2.63`
- Console adapter: `http`; no Hybrid or Mock fallback
- Worker: standard `execution.benchmark_run` lease/authority composition

The Console discovered the complete request from the Server preset, selected
the default simulated Development target, posted the request to preflight, and
received `ready_with_substitutions`. Create remained disabled until that
preflight was displayed.

## Four-Case Run

- Run: `run_d733cdd641c8e727d40dab6194ee6dcf1091c4589e1fae6c4dc62553a57f3150`
- Terminal status: `completed_with_substitutions`
- Case progress: `4/4`
- NODE, CORE, MCP, XCHAIN repetitions: all `completed/completed`
- Substitution count: `7`
- Run events: `31`
- Repetition events: `44`
- Diagnostic evaluations: `4`
- Typed artifacts: `18`
- Formal eligible: `false`
- Qualification: `not_requested`
- Quality score: `null` / Console `—`
- Release gate: `unavailable`

The restart baseline kept counts at `31/44/4/18`; the standard worker did not
repeat Candidate submission after restart.

The Console independently reads PostgreSQL Run repetitions and events instead
of waiting for the ClickHouse dashboard. It discovered all four repetition IDs
and displayed Agent, SMPP Provider, and Physical layers. Qualification,
external capabilities, and every repetition's detail, artifact inventory,
execution trace, physical verification, and fault attribution returned HTTP
`200`. XCHAIN physical verification and fault attribution were checked in the
rendered page.

## Cancellation

- Server baseline Run:
  `run_6085223c42f76e201d0885b8883bd21dfb9992ce344ddca8f97ec3b9c3014184`
- Transition: `queued → cancelled` before worker claim
- Case count: `0`
- Console displayed PostgreSQL status and cancellation phase as `cancelled`,
  and disabled further cancellation.

A second UI-driven cancellation raced with the fast Development worker and
received `409 BENCHMARK_STATE_INVALID` after the Run had already completed. The
Console showed that error and the actual terminal authority status; it did not
rewrite the Run as cancelled.

## 503 / recovery

The Console proxy was restarted against an unavailable upstream. `/runs/new`
showed the explicit preset-load failure, kept create disabled, and did not show
the Mock adapter ribbon. After restoring the real upstream, the preset and HTTP
mode recovered without application state fabrication.

## Non-blocking Development gaps

- ClickHouse dashboard/evidence projection remained unavailable for these Runs.
  PostgreSQL authority and typed artifacts remained fully usable.
- Seven external capabilities used explicit Development substitutions.
- The historical P10 registry remains reference-only provenance and is not
  accepted for formal qualification.

These gaps are visible and make the results non-formal; they do not prevent
functional development, debugging, Run completion, or diagnostic inspection.
