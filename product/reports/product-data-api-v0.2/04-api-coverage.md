# Product Data API v0.2 — Console API Coverage

## Frozen contract

- Server OpenAPI SHA-256: `0061c26ae29efea41ceee4686cd308fef6e58340beb92bd2ec3991f250fed4b4`.
- Paths, operations, and unique operation IDs: `125 / 125 / 125`.
- The generated client is reproducible after Orval generation and whitespace normalization.
- The original 114 operations remain; all 11 v0.2 operations are additive.

## Product v0.2 bindings

The Console HTTP adapter binds preset list/detail, rerun, diagnostic summary,
substitution inventory, timeline, repetition evaluation, artifact
metadata/content, data completeness, and diagnostic outcome distribution.
The adapter contract suite invokes all 11 paths and rejects HTTP failures rather
than falling back to Mock data.

## Typed UI consumers

- Run Create consumes Server-discovered preset/dataset/candidate/case/repeat
  configuration and uses the configured compatibility request template only as
  the complete Development execution environment base.
- Run Detail consumes typed summary, timeline, substitutions, repetition
  evaluation, artifacts, and immutable rerun responses.
- Artifact Viewer validates ownership metadata, media type, UTF-8 byte size,
  and the browser-computed SHA-256 before marking content verified.
- Analytics and Data Completeness render typed tables/cards; raw payloads remain
  behind explicit Debug actions.

## Verification

- `pnpm api:verify`: PASS, 125 operations and exact hash.
- `pnpm check`: PASS, Vitest `38/38`, strict TypeScript, production build.
- Large Vite chunk warning is recorded as non-blocking and does not affect the
  functional Development workflow.
