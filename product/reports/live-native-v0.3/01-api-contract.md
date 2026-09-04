# Live-Native v0.3 API Contract

## Baseline

- Console v0.3 is stacked exactly on
  `feature/benchmark-console-product-data-api-v0.2@99b67f1be3d9d2e20dbe98fc24ca93248b9f7e1c`.
- The accepted v0.2 OpenAPI SHA-256 is
  `92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15`.
- The accepted generated client contains 125 operations and passes its binding
  verifier.

## v0.3 frozen lock

- Server branch: `feature/benchmark-live-native-operations-v0.3`
- Server commit: `e328b09204447e9f9ab367171b30e8a79efe8ccd`
- OpenAPI SHA-256: `335c50caea64b9ac6aa0aac69c143d73ee802955715ab79218f6f9801b8b81a3`
- OpenAPI / Router / Server inventory: `172 / 172 / 172`
- Schemas: `326`
- Console source lock and generated client verification: `172 operations / 172 unique operationIds`

## Additive contract

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

The unique M1 contract is frozen and mechanically synchronized into the Console.
The generated DTOs are the Console wire types; local operational names only alias
those generated types. Server authority implementations may move from typed
unavailable to available during M2–M10 without changing this contract.

The first M1 runtime probe found that the temporary unavailable adapter emitted
`data: null` for envelopes whose frozen schemas require a concrete DTO or array,
including the SSE event envelope. Server corrected the implementation without
contract drift in M2/M3. Console browser verification now reads 15 topology
components, 12 edges, one environment, one resource, and a non-null typed SSE
snapshot from the frozen contract. M4-M10 implementation head is
`c30d8b2a8ae9e3323a2ef59656ff1f1b196d77ce`; the contract lock remains M1 commit
`e328b09204447e9f9ab367171b30e8a79efe8ccd` and SHA-256
`335c50caea64b9ac6aa0aac69c143d73ee802955715ab79218f6f9801b8b81a3`.
