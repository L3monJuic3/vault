#!/usr/bin/env bash
# scripts/generate-types.sh
# Generate TypeScript types from FastAPI OpenAPI schema.
# Run after any API schema changes.
#
# Pipeline: FastAPI (Pydantic) → OpenAPI JSON → openapi-typescript → TypeScript types
# Zero hand-written API types on the frontend. Single source of truth.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

API_URL="${API_URL:-http://localhost:8000}"
SCHEMA_PATH="$REPO_ROOT/packages/shared-types/openapi.json"
OUTPUT_PATH="$REPO_ROOT/packages/shared-types/src/generated.ts"

echo "=== Vault Type Generation ==="

# Step 1: Fetch OpenAPI schema from running FastAPI instance
echo "Fetching OpenAPI schema from ${API_URL}/openapi.json..."
if ! curl -sf "${API_URL}/openapi.json" -o "${SCHEMA_PATH}"; then
  echo "Failed to fetch schema. Is the API running?"
  echo "   Start it with: cd apps/api && uvicorn app.main:app --reload"
  exit 1
fi
echo "Schema saved to ${SCHEMA_PATH}"

# Step 2: Install deps if needed
if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found. Install: npm i -g pnpm"
  exit 1
fi

# Step 3: Generate TypeScript types
echo "Generating TypeScript types..."
cd "$REPO_ROOT/packages/shared-types"
pnpm exec openapi-typescript "${SCHEMA_PATH}" -o "src/generated.ts"
echo "Types generated at ${OUTPUT_PATH}"

echo ""
echo "=== Done ==="
echo "Generated types are at ${OUTPUT_PATH}"
echo "The hand-written src/index.ts re-exports these plus any manual additions."
echo "Import in frontend: import type { TransactionRead } from '@vault/shared-types'"
