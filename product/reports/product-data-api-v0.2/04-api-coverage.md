# Product Data API v0.2 — Console API Coverage

## Frozen contract

- Server OpenAPI SHA-256: `92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15`.
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
- All 18 Analytics modules use the Goal Package minimum fields and expose no
  arbitrary public row properties. K7 Evaluation rule/metric rows carry the
  common identity, status, expectation, evidence, data-class, and formalization
  fields.
- Data Completeness renders registry, run, projection, identity, artifact, and
  formal sections explicitly.

## Verification

- `pnpm api:verify`: PASS, 125 operations and exact hash.
- `pnpm check`: PASS, Vitest `38/38`, strict TypeScript, production build.
- Live HTTP Playwright validates all 18 Analytics modules and the exact six
  completeness sections in addition to the Product workflow.
- Large Vite chunk warning is recorded as non-blocking and does not affect the
  functional Development workflow.
