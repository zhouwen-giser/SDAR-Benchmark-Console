# Development Vertical — Console J6 OpenAPI Binding

## Frozen Server source

- Server branch: `codex/ugv-four-case-diagnostic-vertical-v0.1`
- Server commit: `b336b1592d90555289d6c4c57a82a4a79de1d04c`
- OpenAPI SHA-256: `e6e675aa1245f7f4e530046a4cb03d6e890aabc37f60afb5372119191f32cd00`
- Operation count: `114`
- Console source lock: `product/api/benchmark-server.openapi.source-lock.json`

The Server OpenAPI was copied mechanically into the Console and the generated
TypeScript client models were regenerated from that frozen copy. The binding
verifier now requires the preset, preflight, create, authority, cancel, and all
seven diagnostic query paths.

## Bound development operations

- Server-discovered UGV Development preset
- Development run preflight
- Benchmark run create, authority status, and asynchronous cancel
- Diagnostic qualification
- External capability artifacts
- Diagnostic repetition
- Repetition artifact inventory
- Execution trace
- Physical verification
- Fault attribution

Contract adapter tests verify exact preset-to-preflight request preservation,
all operation paths, cancellation response semantics, and HTTP `503` failure
without Mock fallback.

## Verification

- `pnpm api:verify`: PASS
- `pnpm api:generate`: PASS
- `pnpm test`: PASS (`29` tests)
- `pnpm build`: PASS

This phase proves Console contract binding only. It does not claim a real
four-Case Server/worker execution or formal qualification.
