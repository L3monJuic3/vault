# @vault/shared-types

Shared TypeScript types for the Vault frontend, generated from the FastAPI OpenAPI schema.

## How it works

- `src/index.ts` — Hand-written types used across the frontend (current source of truth)
- `src/generated.ts` — Auto-generated types from the API's OpenAPI schema (once the pipeline is active)

## Regenerating types

When the API schemas change (new routes, updated Pydantic models), regenerate the types:

```bash
# From the repo root — requires the API to be running on localhost:8000
pnpm generate-types

# Or from this package directly
pnpm generate:types
```

### Prerequisites

1. The FastAPI backend must be running (`cd apps/api && uvicorn app.main:app --reload`)
2. `pnpm install` must have been run in this package (installs `openapi-typescript`)
3. `curl` must be available (used to fetch the OpenAPI schema)

### What gets generated

The script fetches `/openapi.json` from the running API, then runs `openapi-typescript` to produce `src/generated.ts`. The hand-written `src/index.ts` will eventually re-export from `generated.ts` once all API routes are stable.

## Importing in the frontend

```tsx
import type { TransactionRead, CategoryRead, AccountRead } from "@vault/shared-types";
```
