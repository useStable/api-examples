# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Educational repo — TypeScript client and examples for the Stable REST API.
Customers reference this to learn the API. Keep code simple and well-documented.

## Commands

```bash
bun run check              # lint (biome)
bun run format             # auto-format (biome)
bunx tsc --noEmit          # type check
bun run example:dashboard  # mail dashboard
bun run example:digest     # AI mail digest (requires openai)
bun run example:extract    # data extraction results
```

## Architecture

- `src/types.ts` — API types derived from OpenAPI spec (`@generated` date stamp)
- `src/client.ts` — `StableClient` wraps fetch, uses `x-api-key` header, returns typed responses. `StableApiError` for non-2xx. `paginate()` async generator for auto-pagination.
- `src/index.ts` — barrel re-export
- `examples/` — self-contained scripts, each imports only from `src/index.ts`

## Conventions

- No runtime dependencies — only dev deps (biome, bun-types) and optional deps (openai)
- TSDoc on all public interfaces and methods in `src/`
- Examples support `STABLE_BASE_URL` env var for local/staging testing
- All list endpoints return Relay-style cursor connections (`first`/`after`/`last`/`before`)
