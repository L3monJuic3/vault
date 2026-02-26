# scripts/setup-repo.sh
# Run this FIRST before any other work.
# Sets up the Vault repo with correct Git identity and monorepo structure.

#!/usr/bin/env bash
set -euo pipefail

echo "=== Vault Repository Setup ==="

# ─── Git Identity ───
git config user.name "L3monJuic3"
git config user.email "ethan.lane@outlook.co.nz"
echo "✓ Git identity: L3monJuic3 <ethan.lane@outlook.co.nz>"

# ─── Verify GitHub CLI auth ───
if ! gh auth status &>/dev/null; then
  echo "⚠ GitHub CLI not authenticated. Run: gh auth login"
  echo "  Select: GitHub.com → HTTPS → Login with browser"
  exit 1
fi
echo "✓ GitHub CLI authenticated"

# ─── Create GitHub repo ───
REPO_NAME="vault"
GITHUB_USER="L3monJuic3"

if gh repo view "${GITHUB_USER}/${REPO_NAME}" &>/dev/null; then
  echo "✓ Repo ${GITHUB_USER}/${REPO_NAME} already exists"
  gh repo clone "${GITHUB_USER}/${REPO_NAME}" "${REPO_NAME}" 2>/dev/null || true
  cd "${REPO_NAME}"
else
  echo "Creating repo ${GITHUB_USER}/${REPO_NAME}..."
  gh repo create "${GITHUB_USER}/${REPO_NAME}" \
    --public \
    --description "Open-source personal finance intelligence platform. AI-powered bank statement analysis." \
    --license MIT \
    --clone
  cd "${REPO_NAME}"
  echo "✓ Repo created and cloned"
fi

# ─── Re-apply git config inside repo ───
git config user.name "L3monJuic3"
git config user.email "ethan.lane@outlook.co.nz"

# ─── Branch setup ───
git checkout -b develop 2>/dev/null || git checkout develop
echo "✓ On develop branch"

# ─── Monorepo directory structure ───
mkdir -p apps/web/app
mkdir -p apps/web/components/ui
mkdir -p apps/web/components/layout
mkdir -p apps/web/components/dashboard
mkdir -p apps/web/components/upload
mkdir -p apps/web/components/transactions
mkdir -p apps/web/components/subscriptions
mkdir -p apps/web/components/settings
mkdir -p apps/web/lib
mkdir -p apps/web/hooks
mkdir -p apps/web/public

mkdir -p apps/api/app/models
mkdir -p apps/api/app/schemas
mkdir -p apps/api/app/routes
mkdir -p apps/api/app/services
mkdir -p apps/api/app/services/parsers
mkdir -p apps/api/app/tasks
mkdir -p apps/api/app/ai
mkdir -p apps/api/app/middleware
mkdir -p apps/api/tests/fixtures
mkdir -p apps/api/tests/integration
mkdir -p apps/api/alembic/versions

mkdir -p packages/shared-types/src

mkdir -p docker
mkdir -p docs/plans
mkdir -p docs/adr
mkdir -p scripts

mkdir -p .claude
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

echo "✓ Directory structure created"

# ─── Root config files ───

# .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
.pnpm-store/
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/

# Build
.next/
dist/
build/
*.egg

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
docker/data/

# Coverage
coverage/
htmlcov/
.coverage

# Worktrees
.worktrees/
worktrees/

# Misc
*.log
.turbo/
GITIGNORE

# .env.example
cat > .env.example << 'ENVEXAMPLE'
# Database
DATABASE_URL=postgresql+asyncpg://vault:vault@localhost:5432/vault
DATABASE_URL_SYNC=postgresql://vault:vault@localhost:5432/vault

# Redis
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET=change-me-in-production
AUTH_REQUIRED=false

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your-key-here

# App
APP_ENV=development
APP_DEBUG=true
CORS_ORIGINS=http://localhost:3000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
ENVEXAMPLE

echo "✓ Root config files created"

# ─── pnpm workspace ───
cat > pnpm-workspace.yaml << 'PNPM'
packages:
  - 'apps/web'
  - 'packages/*'
PNPM

# ─── Root package.json ───
cat > package.json << 'PKG'
{
  "name": "vault",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check",
    "generate-types": "./scripts/generate-types.sh"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
PKG

# ─── turbo.json ───
cat > turbo.json << 'TURBO'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "test": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
TURBO

echo "✓ Monorepo config created"

# ─── Initial commit ───
git add -A
git commit -m "chore: initial monorepo scaffold

- pnpm workspaces + Turborepo
- Directory structure per design spec
- .env.example, .gitignore
- MIT license"

echo ""
echo "=== Setup Complete ==="
echo "Repo: ${GITHUB_USER}/${REPO_NAME}"
echo "Branch: develop"
echo "Identity: L3monJuic3 <ethan.lane@outlook.co.nz>"
echo ""
echo "Next: Run the orchestrator plan from docs/plans/"
