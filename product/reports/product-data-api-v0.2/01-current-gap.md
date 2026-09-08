# Product Data and API v0.2 — K0 Current Gap

## Baseline result

- Goal Package SHA-256 and all 52 packaged checksum entries: PASS.
- Console parent branch and remote head both equal
  `633c4d4d714246199d14675f85d1e65d910082ef`.
- Server parent branch and remote head both equal
  `1d91138b56eb70e4edebe4c72fd0a824820ccf87`.
- Parent PR #1 and PR #4 remain open Draft PRs, so the v0.2 branches remain
  stacked on their Development Vertical parents.
- Console worktree was clean before creating
  `feature/benchmark-console-product-data-api-v0.2`.
- Frozen OpenAPI verification: 114 operations, SHA-256
  `e6e675aa1245f7f4e530046a4cb03d6e890aabc37f60afb5372119191f32cd00`.
- Console baseline: API verification PASS, Vitest `29/29` PASS, strict
  TypeScript and production Vite build PASS. The existing large-bundle warning
  remains non-blocking.

## Product gaps to close

1. Run creation and Development execution still derive their authority path
   from a four-Case catalog rather than immutable Dataset definitions.
2. Dataset 0.1 contains four smoke Cases; Dataset 0.2 must contain 12 complete
   immutable Cases across four Tracks.
3. Development PostgreSQL facts and typed artifacts are not fully projected
   through the normal outbox/projector path into ClickHouse.
4. Five operations remain `PARTIAL_BLOCKED_DATA`: Run operational summary and
   Skills, Providers, Score Distribution, and Operational analytics.
5. Public Evaluation/Analytics responses still contain generic object rows.
6. Console Run, Evaluation, and Analytics primary views still depend on static
   Case data or raw JSON presentation.
7. General preset discovery, rerun lineage, artifact content, diagnostic
   summary/timeline/substitution, repetition evaluation, data completeness, and
   diagnostic outcome distribution operations do not yet exist.

## Frozen boundaries

- PostgreSQL remains Registry/Run/Repetition/Evaluation/Rerun authority.
- ArtifactStore remains immutable content authority; ClickHouse is rebuildable
  projection only.
- External Runtime, SMPP, Provider, Simulator, and Telemetry repositories are
  read-only. Missing native data uses explicit Development substitutions and
  never pauses v0.2 product work.
- Development data carries explicit `dataClass`, authority, source references,
  watermark, projection lag, and `formalEligible=false`.
- No Formal Score, Baseline, Release Gate PASS, authentication scope, PDF, or
  browser-based Dataset authoring is included.

## K0 exit

K0 passes. Source ancestry is exact, both parent PRs remain Draft, the Console
baseline is green, and the v0.2 Console branch is ready for the final
125-operation Server contract.
