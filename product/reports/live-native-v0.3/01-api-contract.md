# Live-Native v0.3 API Contract

## Baseline

- Console v0.3 is stacked exactly on
  `feature/benchmark-console-product-data-api-v0.2@99b67f1be3d9d2e20dbe98fc24ca93248b9f7e1c`.
- The accepted v0.2 OpenAPI SHA-256 is
  `92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15`.
- The accepted generated client contains 125 operations and passes its binding
  verifier.

## v0.3 freeze target

The Server contract must retain all 125 operations and add exactly the 47
operations in `matrices/API_DELTA_47.csv`, for 172 OpenAPI operations, router
operations, capability entries, and generated Console client operations.

The 47 operations cover five topology operations, six environment operations,
six resource operations, eight Run-native operations, six repetition-native
operations, four reconciliation operations, four telemetry operations, two
attention evidence operations, and six native analytics operations.

All new query operations use `sdar-benchmark.resource-envelope/v1` metadata.
The Console will preserve `authority`, `dataClass`, `availability`,
`formalEligible`, `revision`, `watermark`, `projectionLagMs`, `sourceRefs`,
`reasonCodes`, `unavailableFields`, and `warnings`; it will not translate an
unavailable response into Mock or Seed data.

## Compatibility and boundary

- The fifteen existing endpoint extensions are additive.
- Browser traffic remains Benchmark Server HTTP/SSE only.
- SSE is transport, while snapshot/resource authorities remain authoritative.
- Reconciliation cannot create a navigation, MCP Task, Provider Execution, or
  physical side effect.
- Native diagnostic views remain `formalEligible=false`; they do not expose a
  Formal Score, Baseline, or Release Gate PASS.

## Current state

The v0.3 OpenAPI is not yet frozen. Console generation and implementation will
begin immediately after the Server session publishes one reproducible 172-op
path/hash/commit lock. This wait does not block independent Console structure,
component tests, or M0 evidence work.
