# Development Vertical — Console J7/J8 Workflow

## J7 create workflow

`/runs/new` now provides one UGV four-Case entry point:

- default `Development · Simulated` mode with an explicit Live toggle;
- Server-discovered request template, with no hard-coded live environment ID;
- exact-commit provenance warning without a Development authorization block;
- required preflight before create;
- visible `ready`, `ready_with_substitutions`, or `failed_preflight` state;
- Native / proxy / deterministic substitute plan display;
- immutable preflight attached to the Development execution policy on create;
- persistent idempotency key for the page session;
- fixed Development boundary: `formalEligible=false`, score `—`, release gate
  `unavailable`.

## J8 monitor and diagnostics

`/runs/:runId` separates:

1. PostgreSQL Run Authority;
2. standard worker execution phase;
3. Evidence projection availability;
4. diagnostic evaluation availability.

Cancellation is displayed as an asynchronous sequence: request accepted,
cleanup running, then only the authority terminal state is shown as cancelled.
Polling stops for terminal statuses. Diagnostic artifacts are grouped as Agent,
SMPP Provider, and Physical layers. Missing artifacts or projections remain
local `unavailable`/`pending` states and do not blank the page or rewrite the
authority status.

## Verification boundary

- Contract and component tests: PASS (`29` tests).
- Production build: PASS.
- In-app local browser: preset loaded, four Case matrix rendered, create disabled
  before preflight, `ready_with_substitutions` rendered, create enabled after
  preflight, and monitor page rendered after creation.
- Browser console contained no application exception; the only message was the
  pre-existing Ant Design v5 / React 19 compatibility warning.

The local browser check used the explicit Mock adapter and is not accepted as
the joint Development E2E. J9–J11 remain pending the Server J5 PostgreSQL and
standard-worker evidence package and the shared `192.168.2.63` deployment.
