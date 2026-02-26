#!/usr/bin/env bash
# scripts/generate-types.sh
# Generate TypeScript types from FastAPI OpenAPI schema.
# Run after any API schema changes.
#
# Pipeline: FastAPI (Pydantic) → OpenAPI JSON → openapi-ts → TypeScript types
# Zero hand-written API types on the frontend. Single source of truth.

set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"
SCHEMA_PATH="packages/shared-types/openapi.json"
OUTPUT_DIR="packages/shared-types/src"

echo "=== Vault Type Generation ==="

# Step 1: Fetch OpenAPI schema from running FastAPI instance
echo "Fetching OpenAPI schema from ${API_URL}/openapi.json..."
if ! curl -sf "${API_URL}/openapi.json" -o "${SCHEMA_PATH}"; then
  echo "❌ Failed to fetch schema. Is the API running?"
  echo "   Start it with: docker compose up api"
  exit 1
fi
echo "✓ Schema saved to ${SCHEMA_PATH}"

# Step 2: Generate TypeScript types
echo "Generating TypeScript types..."
if ! command -v pnpm &>/dev/null; then
  echo "❌ pnpm not found. Install: npm i -g pnpm"
  exit 1
fi

cd packages/shared-types
pnpm exec openapi-ts "${SCHEMA_PATH}" -o "${OUTPUT_DIR}/api-types.ts"
echo "✓ Types generated at ${OUTPUT_DIR}/api-types.ts"

# Step 3: Verify types compile
echo "Verifying types compile..."
pnpm exec tsc --noEmit
echo "✓ Types compile cleanly"

echo ""
echo "=== Done ==="
echo "Types are ready at packages/shared-types/src/api-types.ts"
echo "Import in frontend: import { TransactionRead, CategoryRead } from '@vault/shared-types'"
