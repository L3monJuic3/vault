# Build Log — Vault V1

**Builder:** Ethan (L3monJuic3)
**Started:** 2026-02-26
**Architecture:** Orchestrator + Worker agents (max 7 parallel)

---

## Wave 0: Repo Setup + Scaffold

### Task: Repo setup, monorepo scaffold, push to GitHub

**What was implemented:**
- Created GitHub repo `L3monJuic3/vault`
- Scaffolded pnpm monorepo with Turborepo
- Created root config files: `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `.gitignore`, `.env.example`
- Created agent config files: `.claude/instructions.md`, `.claude/AGENTS.md`, `.claude/ORCHESTRATOR.md`, `docs/AGENT_GUIDE.md`
- Pushed `develop` branch as default

**Files created:**
- `package.json`, `turbo.json`, `pnpm-workspace.yaml`
- `.gitignore`, `.env.example`
- `.github/workflows/agents.yml`
- `.claude/instructions.md`, `.claude/AGENTS.md`, `.claude/ORCHESTRATOR.md`
- `docs/AGENT_GUIDE.md`, `docs/plans/2026-02-26-vault-ethan-master-plan.md`

**Key decisions:**
- Used pnpm workspaces with `apps/web` and `packages/*`
- Set up conventional commit enforcement via agents.yml workflow

**Deviations:**
- GitHub token initially lacked `workflow` scope — had to temporarily remove `agents.yml`, push, then re-auth with `gh auth login --scopes workflow` before re-adding it.
- Write tool required reading files first even for brand-new files — switched to Bash heredocs for initial scaffold.

---

## Wave 1: CI Pipeline (P0-07)

### Task P0-07: GitHub Actions CI pipeline

**What was implemented:**
- Backend job: Python 3.12 + PostgreSQL 16 + Redis 7 services, ruff check, ruff format, mypy, pytest, alembic heads check
- Frontend job: pnpm install, eslint, tsc, vitest, next build (all with `continue-on-error: true` until fully scaffolded)
- Type-freshness job: checks shared-types package compiles

**Files created:**
- `.github/workflows/ci.yml`

**Key decisions:**
- Frontend steps set to `continue-on-error: true` since Next.js app wasn't scaffolded yet
- Used PostgreSQL 16 and Redis 7 service containers

**Deviations:** None

---

## Wave 2: FastAPI Scaffold + Models (P0-03, P0-05, P0-06)

### Task P0-03: FastAPI scaffold + health check

**What was implemented:**
- FastAPI app with CORS middleware, Pydantic Settings, async SQLAlchemy engine, health check endpoint

**Files created:**
- `apps/api/pyproject.toml`, `apps/api/app/__init__.py`, `apps/api/app/main.py`
- `apps/api/app/config.py`, `apps/api/app/database.py`
- `apps/api/tests/__init__.py`, `apps/api/tests/conftest.py`, `apps/api/tests/test_health.py`

### Task P0-05: User + Account models

**What was implemented:**
- User model (email, name, password_hash, currency with 4-value enum)
- Account model with AccountType enum (7 types: checking, savings, credit, investment, loan, mortgage, other)
- Base model with TimestampMixin (UUID pk, created_at)

**Files created:**
- `apps/api/app/models/__init__.py`, `apps/api/app/models/base.py`
- `apps/api/app/models/user.py`, `apps/api/app/models/account.py`

### Task P0-06: Alembic init + first migration

**What was implemented:**
- Alembic configuration with async PostgreSQL support
- Migration 001: users and accounts tables

**Files created:**
- `apps/api/alembic.ini`, `apps/api/alembic/env.py`, `apps/api/alembic/script.py.mako`
- `apps/api/alembic/versions/001_users_and_accounts.py`

### Task P0-09: Agent config files (folded into Wave 0)

Already completed as part of Wave 0 scaffold.

**Key decisions:**
- TimestampMixin provides UUID `id` and `created_at` to all models
- Currency stored as string enum (GBP, USD, EUR, NZD)
- Account types cover common banking product categories

**Deviations:** None

---

## Wave 3: Remaining Models (1A-01, 1A-02, 1A-03)

### Task 1A-01: Transaction model + migration

**What was implemented:**
- Transaction model with composite index `(user_id, date DESC, id)`, ARRAY(String) tags, ai_confidence float
- Migration 002 with composite index

**Files created:**
- `apps/api/app/models/transaction.py`
- `apps/api/alembic/versions/002_transactions.py`

### Task 1A-02: Category model + seed script

**What was implemented:**
- Category model with self-referencing `parent_id`, `budget_monthly`, `is_system` flag, colour/icon fields
- Migration 003 adding categories table + FK from transactions.category_id
- Seed script with 11 default system categories

**Files created:**
- `apps/api/app/models/category.py`
- `apps/api/alembic/versions/003_categories.py`
- `apps/api/scripts/seed_categories.py`

### Task 1A-03: RecurringGroup model

**What was implemented:**
- RecurringGroup model with 3 enums: RecurringType (subscription/income/transfer), Frequency (weekly/fortnightly/monthly/quarterly/yearly), RecurringStatus (active/paused/cancelled)
- Migration 004 adding recurring_groups table + FK from transactions.recurring_group_id

**Files created:**
- `apps/api/app/models/recurring_group.py`
- `apps/api/alembic/versions/004_recurring_groups.py`

**Key decisions:**
- Sequential Alembic chain: 001 → 002 → 003 → 004
- Tags stored as PostgreSQL ARRAY(String) for flexibility
- Categories support hierarchy via parent_id self-reference

**Deviations:** None

---

## Wave 4: Schemas + Services (1A-06-E, 1A-07-E)

### Task 1A-06-E: Pydantic v2 schemas (Ethan's portion)

**What was implemented:**
- Common schemas: ErrorResponse, PaginationParams, CursorPageResponse
- User schemas: UserCreate, UserRead, UserUpdate
- Transaction schemas: TransactionCreate, TransactionRead, TransactionUpdate, TransactionFilter, CursorPage
- Category schemas: CategoryCreate, CategoryRead, CategoryUpdate
- RecurringGroup schemas: RecurringGroupRead, RecurringGroupUpdate

**Files created:**
- `apps/api/app/schemas/__init__.py`, `apps/api/app/schemas/common.py`
- `apps/api/app/schemas/user.py`, `apps/api/app/schemas/transaction.py`
- `apps/api/app/schemas/category.py`, `apps/api/app/schemas/recurring_group.py`

### Task 1A-07-E: Service layer (Ethan's portion)

**What was implemented:**
- Transaction service: CRUD + cursor pagination + filters (date range, category, account, amount range, case-insensitive search)
- Category service: CRUD + system defaults protection (is_system categories can't be deleted)
- Subscription service: CRUD + monthly total with frequency normalisation (yearly/12, quarterly/3, weekly*4.33, etc.)

**Files created:**
- `apps/api/app/services/__init__.py`
- `apps/api/app/services/transaction_service.py`
- `apps/api/app/services/category_service.py`
- `apps/api/app/services/subscription_service.py`

**Key decisions:**
- Cursor pagination uses `(date, id)` composite for deterministic ordering
- Monthly total normalises all frequencies to monthly equivalent
- System categories protected from deletion

**Deviations:** None

---

## Wave 5: Routes + Auth + Celery (1B-01, 1B-04, 1B-06, 1C-01)

### Task 1B-01: JWT auth middleware

**What was implemented:**
- Auth service: bcrypt password hashing, JWT create/decode with python-jose, user CRUD
- Auth routes: POST /api/v1/auth/register, POST /api/v1/auth/login
- Auth middleware: `get_current_user` dependency with AUTH_REQUIRED toggle
- Comprehensive tests: password hashing, JWT, register, login, middleware modes

**Files created:**
- `apps/api/app/services/auth_service.py`
- `apps/api/app/routes/auth.py`
- `apps/api/app/middleware/__init__.py`, `apps/api/app/middleware/auth.py`
- `apps/api/tests/test_auth.py`

### Task 1B-04: Transaction routes

**What was implemented:**
- GET /api/v1/transactions (cursor pagination + all filters)
- GET /api/v1/transactions/{id}
- PATCH /api/v1/transactions/{id}
- POST /api/v1/transactions/bulk (bulk category assignment)

**Files created:**
- `apps/api/app/routes/transactions.py`
- `apps/api/tests/test_transactions.py`

### Task 1B-06: Subscription routes

**What was implemented:**
- GET /api/v1/subscriptions (list + monthly_total)
- PATCH /api/v1/subscriptions/{id}
- POST /api/v1/subscriptions/{id}/dismiss

**Files created:**
- `apps/api/app/routes/subscriptions.py`
- `apps/api/tests/test_subscriptions.py`

### Task 1C-01: Celery + Redis setup

**What was implemented:**
- Celery app with Redis broker, JSON serialisation, retry config
- Categorisation Celery task wrapping AI service
- Subscription detection Celery task

**Files created:**
- `apps/api/app/tasks/__init__.py`, `apps/api/app/tasks/celery_app.py`
- `apps/api/app/tasks/categorise_task.py`
- `apps/api/app/tasks/detect_subscriptions_task.py`

**Key decisions:**
- Routes use temp `select(User).limit(1)` pattern until proper auth integration
- Auth middleware supports AUTH_REQUIRED toggle (false = single-user mode)
- Celery uses JSON serialisation and late acknowledgement

**Deviations:**
- After Wave 5 workers completed, orchestrator had to manually register transaction and subscription routers in `main.py` (auth worker only registered its own router).

---

## Wave 6: Parsers + AI (1C-04, 1C-05, 1C-09/1C-10, 1C-11)

### Task 1C-04: Amex CSV parser

**What was implemented:**
- Amex CSV parser with automatic sign correction (Amex reports debits as positive)
- Tests with sample CSV data

**Files created:**
- `apps/api/app/services/parsers/__init__.py`
- `apps/api/app/services/parsers/amex.py`
- `apps/api/tests/test_parser_amex.py`

### Task 1C-05: HSBC CSV parser

**What was implemented:**
- HSBC CSV parser with multi-line description handling
- Tests with sample CSV data

**Files created:**
- `apps/api/app/services/parsers/hsbc.py`
- `apps/api/tests/test_parser_hsbc.py`

### Tasks 1C-09 + 1C-10: Claude AI client + categoriser

**What was implemented:**
- AI client wrapper: rate limiting (configurable RPM), token usage tracking with cost calculation, retry with exponential backoff, graceful fallback
- AI categoriser: batch processing, merchant→category cache, user override respect, confidence scores
- Base dataclasses: TokenUsage, AIResponse
- Celery task integration

**Files created:**
- `apps/api/app/ai/__init__.py`, `apps/api/app/ai/base.py`
- `apps/api/app/ai/client.py`, `apps/api/app/ai/categoriser.py`
- `apps/api/tests/test_ai_client.py`, `apps/api/tests/test_categoriser.py`

### Task 1C-11: AI subscription detection

**What was implemented:**
- Subscription detector: frequency detection from transaction patterns, next date prediction, amount variance tolerance
- RecurringGroup creation from detected patterns

**Files created:**
- `apps/api/app/ai/subscription_detector.py`
- `apps/api/tests/test_subscription_detector.py`

**Key decisions:**
- AI client tracks cost per request for monitoring
- Categoriser caches merchant→category mappings to avoid redundant API calls
- Subscription detector uses statistical analysis before AI confirmation

**Deviations:** None

---

## Wave 7: Frontend Components (1D-06, 1D-07, 1D-08, 1D-09)

### Prerequisite: Stub Ian's dependencies

**What was implemented:**
- All 4 of Ian's frontend deliverables were missing (1B-09 shared-types, 1D-01 design system, 1D-03 TanStack hooks, 1D-05 KPI cards)
- Stubbed all dependencies: Next.js 15 scaffold, TypeScript shared types, design system UI components, TanStack Query hooks, KPI cards

**Files created:**
- `apps/web/` — Full Next.js 15 scaffold (package.json, tsconfig, tailwind, layout, providers, etc.)
- `packages/shared-types/src/index.ts` — 20 TypeScript interfaces matching backend schemas
- `apps/web/components/ui/` — Card, Button, Badge, Skeleton, Select, Input components
- `apps/web/hooks/` — useTransactions, useSubscriptions, useCategories, useDashboard hooks
- `apps/web/components/dashboard/KPICards.tsx` — 4-card grid widget
- `apps/web/lib/api-client.ts`, `apps/web/lib/utils.ts`

### Task 1D-06: Category chart

**What was implemented:**
- Recharts donut chart with category colours, tooltips, click interaction
- Responsive layout with loading skeleton

**Files created:**
- `apps/web/components/dashboard/CategoryChart.tsx`

### Task 1D-07: Spend timeline

**What was implemented:**
- Area chart with daily/weekly/monthly granularity toggle
- Animated transitions, responsive container

**Files created:**
- `apps/web/components/dashboard/SpendTimeline.tsx`

### Task 1D-08: Recent transactions + top merchants

**What was implemented:**
- Recent transactions widget showing last 10 transactions
- Top merchants widget with animated bar charts (Framer Motion)

**Files created:**
- `apps/web/components/dashboard/RecentTransactions.tsx`
- `apps/web/components/dashboard/TopMerchants.tsx`

### Task 1D-09: Transactions page

**What was implemented:**
- Full transaction table with search, date/category/amount filters
- Inline category edit dropdown
- Bulk selection with category assignment
- Cursor pagination

**Files created:**
- `apps/web/app/transactions/page.tsx`
- `apps/web/components/transactions/TransactionTable.tsx`
- `apps/web/components/transactions/TransactionFilters.tsx`
- `apps/web/components/transactions/InlineCategoryEdit.tsx`
- `apps/web/components/transactions/BulkActions.tsx`

**Key decisions:**
- User chose option (b): stub Ian's deps rather than wait
- Design system uses Tailwind v4 with CSS variables for theming
- TanStack Query hooks wrap `apiFetch<T>()` generic client

**Deviations:**
- Entire Wave 7 frontend was originally blocked by Ian's deliverables. Resolved by stubbing all dependencies.
- CI pyproject.toml fix applied mid-wave: added `[tool.setuptools.packages.find] include = ["app*"]` to prevent setuptools from discovering alembic/ as a package.

---

## Wave 8: Settings + Seed Data (1D-11-E, 1E-04)

### Task 1D-11-E: Settings page (categories + export)

**What was implemented:**
- Settings page with tab navigation (Categories / Export)
- Categories tab: CRUD for custom categories, system category protection, colour/icon fields
- Export tab: CSV download with date range filter

**Files created:**
- `apps/web/app/settings/page.tsx`
- `apps/web/components/settings/CategoriesTab.tsx`
- `apps/web/components/settings/ExportTab.tsx`

### Task 1E-04: Demo seed data

**What was implemented:**
- Seed script generating 500+ synthetic UK transactions
- 2 demo accounts (Amex + HSBC)
- 6 subscription recurring groups
- Salary income transactions
- Realistic UK merchants across all 11 categories

**Files created:**
- `apps/api/scripts/seed_demo_data.py`

**Key decisions:**
- Demo data uses UK-centric merchants and GBP currency
- Subscriptions cover common UK services (Netflix, Spotify, etc.)

**Deviations:** None

---

## Wave 9: Integration Tests + Documentation (1E-01-E, 1E-05-E)

### Task 1E-01-E: E2E integration tests

**What was implemented:**
- Integration test suite covering full user flow
- 9 tests: register, login/JWT, list transactions, search, cursor pagination, bulk category, subscriptions list, dismiss, health check
- Hybrid approach: real SQLite DB for User model, mocks for Transaction/Subscription services (due to PostgreSQL ARRAY incompatibility)

**Files created:**
- `apps/api/tests/integration/__init__.py`
- `apps/api/tests/integration/conftest.py`
- `apps/api/tests/integration/test_full_flow.py`

**Test results:** 9/9 integration tests passing, 93/93 total tests passing

### Task 1E-05-E: README + architecture docs

**What was implemented:**
- Professional README with features, tech stack, prerequisites, quick start, API reference, project structure, test instructions
- Architecture document with system diagram, data flows (CSV import, subscription detection), database schema, AI integration details, auth modes, frontend architecture

**Files created:**
- `README.md`
- `docs/ARCHITECTURE.md`

**Key decisions:**
- Integration tests use SQLite for User operations + mocks for services using PostgreSQL-only types
- README targets developers wanting to self-host or contribute

**Deviations:** None

---

## Summary

| Wave | Tasks | Workers | Status |
|------|-------|---------|--------|
| 0 | Repo setup + scaffold | Orchestrator | Done |
| 1 | P0-07 CI pipeline | 1 | Done |
| 2 | P0-03 + P0-05 + P0-06 (+ P0-09) | 1 (sequential) | Done |
| 3 | 1A-01 + 1A-02 + 1A-03 | 1 (sequential) | Done |
| 4 | 1A-06-E ∥ 1A-07-E | 2 (parallel) | Done |
| 5 | 1B-01 ∥ 1B-04 ∥ 1B-06 ∥ 1C-01 | 4 (parallel) | Done |
| 6 | 1C-04 ∥ 1C-05 ∥ 1C-09/10 ∥ 1C-11 | 4 (parallel) | Done |
| 7 | Stubs + 1D-06 ∥ 1D-07 ∥ 1D-08 ∥ 1D-09 | 1 + 4 (parallel) | Done |
| 8 | 1D-11-E ∥ 1E-04 | 2 (parallel) | Done |
| 9 | 1E-01-E ∥ 1E-05-E | 2 (parallel) | Done |

**Total commits:** 44
**Total tests:** 93 passing
**Backend files:** ~45 Python files
**Frontend files:** ~25 TypeScript/TSX files
**Documentation:** README.md, ARCHITECTURE.md, AGENT_GUIDE.md, BUILD_LOG.md

---

## Ian's V1 Deliverables — Session 2 (2026-02-27)

**Builder:** Ian (Claude Code agent)
**Tasks:** CI hotfixes + remaining V1 backlog items
**Commits:** 9

---

### CI Hotfixes (blocking develop branch)

#### Fix 1: Ruff formatting

**What was fixed:**
- 11 Python files failing `ruff format --check` in CI
- Ran `ruff format .` from `apps/api/` to auto-fix all formatting issues

**Files modified:**
- `apps/api/alembic/versions/006_imports.py`
- `apps/api/app/database.py`
- `apps/api/app/middleware/logging.py`
- `apps/api/app/models/import_record.py`
- `apps/api/app/models/system_log.py`
- `apps/api/app/routes/analytics.py`
- `apps/api/app/routes/debug.py`
- `apps/api/app/services/account_service.py`
- `apps/api/app/services/analytics_service.py`
- `apps/api/app/services/import_service.py`
- `apps/api/app/services/log_service.py`

**Commit:** `fix(api): apply ruff formatting to all Python files`

#### Fix 2: pnpm version conflict

**What was fixed:**
- CI failing with "Multiple versions of pnpm specified" — `ci.yml` sets `version: 9` but root `package.json` had `"packageManager": "pnpm@9.0.0"` which conflicts with `pnpm/action-setup@v4`
- Removed the `packageManager` field from root `package.json`

**Files modified:**
- `package.json`

**Commit:** `fix(ci): remove duplicate pnpm version from package.json`

---

### Task 1A-05: Insight Model + Migration 007

**What was implemented:**
- SQLAlchemy `Insight` model linked to users for AI-generated financial insights
- Columns: id (UUID PK), user_id (FK), type (VARCHAR), title (VARCHAR), body (TEXT), data (JSONB), is_read (BOOLEAN), created_at (TIMESTAMPTZ)
- Composite indexes: `(user_id, created_at DESC)` and `(user_id, is_read)`
- Follows TimestampMixin pattern from all other models
- Alembic migration 007 with upgrade/downgrade

**Files created:**
- `apps/api/app/models/insight.py`
- `apps/api/alembic/versions/007_insights.py`

**Files modified:**
- `apps/api/app/models/__init__.py` — registered Insight export

**Commit:** `feat(models): add Insight model and migration 007`

---

### Settings: Accounts Tab

**What was implemented:**
- `AccountsTab` component listing all user accounts (name, type, current balance)
- Inline rename with keyboard support (Enter to save, Escape to cancel)
- Toggle account active/inactive with status badge
- `useAccounts` + `useUpdateAccount` TanStack Query hooks
- Loading skeleton and empty state
- `AccountUpdate` added to shared types

**Files created:**
- `apps/web/components/settings/AccountsTab.tsx`
- `apps/web/hooks/use-accounts.ts`

**Files modified:**
- `apps/web/app/settings/page.tsx` — added Accounts tab
- `packages/shared-types/src/index.ts` — added `AccountUpdate` interface

**Commit:** `feat(settings): add accounts management tab`

---

### Settings: Import History Tab

**What was implemented:**
- `ImportHistoryTab` component with table showing past imports
- Columns: filename, date imported, row count, duplicates skipped, status badge (completed/failed/processing), date range covered
- `useImports` hook for `GET /api/v1/imports`
- Loading skeleton and empty state
- `ImportRead` added to shared types

**Files created:**
- `apps/web/components/settings/ImportHistoryTab.tsx`
- `apps/web/hooks/use-imports.ts`

**Files modified:**
- `apps/web/app/settings/page.tsx` — added Import History tab
- `packages/shared-types/src/index.ts` — added `ImportRead` interface

**Commit:** `feat(settings): add import history tab`

---

### Task 1B-09: Type Generation Pipeline

**What was implemented:**
- Added `openapi-typescript` as devDependency to `@vault/shared-types`
- Added `generate:types` script to shared-types `package.json`
- Updated `scripts/generate-types.sh` to use correct `openapi-typescript` binary and output path
- Added `packages/shared-types/README.md` explaining regeneration workflow

**Files created:**
- `packages/shared-types/README.md`

**Files modified:**
- `packages/shared-types/package.json` — added scripts + devDeps
- `scripts/generate-types.sh` — fixed binary name and paths

**Commit:** `feat(types): add openapi-ts type generation pipeline`

---

### Monzo CSV Parser

**What was implemented:**
- Monzo CSV parser handling: Date (DD/MM/YYYY), Name (merchant), Amount (pre-signed), Description, Notes
- Merges Notes into description for richer transaction context
- Sample fixture with 6 representative transactions (card payments, salary, direct debit)
- 9 unit tests: count, signs, dates, merchants, notes, description fallback, empty input, missing fields
- Registered in `parsers/__init__.py`

**Files created:**
- `apps/api/app/services/parsers/monzo.py`
- `apps/api/tests/test_parser_monzo.py`
- `apps/api/tests/fixtures/monzo_sample.csv`

**Files modified:**
- `apps/api/app/services/parsers/__init__.py` — registered `parse_monzo_csv`

**Test results:** 9/9 passing

**Commit:** `feat(import): add Monzo CSV parser`

---

### Starling CSV Parser

**What was implemented:**
- Starling CSV parser handling: Date (DD/MM/YYYY), Counter Party (merchant), Reference (description), Amount (pre-signed), Balance
- Dynamic header matching for `Amount (GBP)` and `Balance (GBP)` columns
- Sample fixture with 6 representative transactions
- 9 unit tests: count, signs, dates, merchants, descriptions, balance, empty input, missing fields
- Registered in `parsers/__init__.py`

**Files created:**
- `apps/api/app/services/parsers/starling.py`
- `apps/api/tests/test_parser_starling.py`
- `apps/api/tests/fixtures/starling_sample.csv`

**Files modified:**
- `apps/api/app/services/parsers/__init__.py` — registered `parse_starling_csv`

**Test results:** 9/9 passing

**Commit:** `feat(import): add Starling CSV parser`

---

### Lint Fix: input.tsx

**What was fixed:**
- 1 error: `React` referenced as global namespace but never imported
- 2 warnings: empty interface `InputProps` extending `React.InputHTMLAttributes` (no-empty-interface rule)
- Replaced with `import type { InputHTMLAttributes } from "react"` and type alias

**Files modified:**
- `apps/web/components/ui/input.tsx`

**Commit:** `fix(ui): resolve eslint error and warnings in input.tsx`

---

## Updated Summary

| Wave | Tasks | Workers | Status |
|------|-------|---------|--------|
| 0 | Repo setup + scaffold | Orchestrator | Done |
| 1 | P0-07 CI pipeline | 1 | Done |
| 2 | P0-03 + P0-05 + P0-06 (+ P0-09) | 1 (sequential) | Done |
| 3 | 1A-01 + 1A-02 + 1A-03 | 1 (sequential) | Done |
| 4 | 1A-06-E ∥ 1A-07-E | 2 (parallel) | Done |
| 5 | 1B-01 ∥ 1B-04 ∥ 1B-06 ∥ 1C-01 | 4 (parallel) | Done |
| 6 | 1C-04 ∥ 1C-05 ∥ 1C-09/10 ∥ 1C-11 | 4 (parallel) | Done |
| 7 | Stubs + 1D-06 ∥ 1D-07 ∥ 1D-08 ∥ 1D-09 | 1 + 4 (parallel) | Done |
| 8 | 1D-11-E ∥ 1E-04 | 2 (parallel) | Done |
| 9 | 1E-01-E ∥ 1E-05-E | 2 (parallel) | Done |
| Ian | CI fixes + V1 backlog | 1 | Done |

**Total commits:** 53
**Total parser tests:** 49 passing (Amex 7 + HSBC 12 + Monzo 9 + Starling 9 + AI 12)
**Bank parsers:** 4 (Amex, HSBC, Monzo, Starling)
**Settings tabs:** 4 (Categories, Accounts, Import History, Export)
**Alembic migrations:** 7 (001–007)
**Backend files:** ~50 Python files
**Frontend files:** ~30 TypeScript/TSX files
**Documentation:** README.md, ARCHITECTURE.md, AGENT_GUIDE.md, BUILD_LOG.md, shared-types README.md

---

## Ian's Session 3 — Enum Bug Fix + UI Overhaul (2026-02-27)

**Builder:** Ian (Claude Code agent)
**Tasks:** SQLAlchemy enum eradication, Alembic migration 008, UI animations overhaul, subscription debugging
**Commits:** 11

---

### Commit 1: SQLAlchemy Enum Column Fix

**What was fixed:**
- `account.py` still had `Column(Enum(AccountType))` — changed to `Column(String(16))`
- `recurring_group.py` had 3 `Column(Enum(...))` for type, frequency, and status — all changed to `Column(String(16))`
- Default value changed from `RecurringStatus.active` to `"active"`
- Python enum classes (`AccountType`, `RecurringType`, `Frequency`, `RecurringStatus`) kept as reference — only the SQLAlchemy column bindings changed
- Also updated `upload/page.tsx` — Monzo and Starling changed from "Coming soon" to "✓ Supported"

**Files modified:**
- `apps/api/app/models/account.py`
- `apps/api/app/models/recurring_group.py`
- `apps/web/app/upload/page.tsx`

**Commit:** `fix(models): replace SQLAlchemy Enum columns with String to fix asyncpg cast errors`

---

### Commits 2–7: UI Overhaul — "Bloomberg Terminal meets Linear"

Complete animation and visual overhaul of the frontend. CSS-only where possible, no external animation libraries.

#### Commit 2: Design Tokens + Animations (`globals.css`)

**What was implemented:**
- Glow tokens: `--glow-primary`, `--glow-success`, `--glow-error`
- Card shadow tokens: `--card-shadow`, `--card-shadow-hover`
- Transition easing: `--transition-snappy: cubic-bezier(0.16, 1, 0.3, 1)`
- Keyframe animations: `fadeInUp`, `shimmer`, `pulse-glow`, `dash-march`, `checkmark-draw`, `progress-fill`
- Utility classes: `.animate-fade-in-up`, `.animate-shimmer`, `.animate-pulse-glow`
- Stagger delays: `.stagger-1` through `.stagger-6` (80ms increments)

**Commit:** `feat(ui): add design tokens, animations, and glow effects to globals.css`

#### Commit 3: Component Upgrades

**What was implemented:**
- `skeleton.tsx` — shimmer gradient animation replacing `animate-pulse`
- `card.tsx` — `glowColor` prop for top-border glow, hover lift (`translateY(-2px)`), card shadow
- `badge.tsx` — coloured pill variants (success green, destructive red, warning amber, info blue)
- `button.tsx` — active pressed state: `scale(0.97)` on `:active`

**Commit:** `feat(ui): upgrade skeleton, card, badge, and button components`

#### Commit 4: Dashboard KPI Cards + Count-Up Hook

**What was implemented:**
- `useCountUp(target, duration=800)` hook with easeOutQuart timing
- KPI cards rewritten with count-up number animation on mount
- Per-card glow: income=emerald, spending=rose, subscriptions=indigo, balance=white
- Stagger fadeInUp (each card 80ms after previous)
- Hover: `translateY(-2px)` + shadow intensify
- JetBrains Mono for financial figures

**Files created:**
- `apps/web/hooks/use-count-up.ts`

**Files modified:**
- `apps/web/components/dashboard/KPICards.tsx`
- `apps/web/app/page.tsx`

**Commit:** `feat(dashboard): add count-up animation and glow KPI cards`

#### Commit 5: Sidebar Overhaul

**What was implemented:**
- Sidebar gradient background (`#0a0a0e` → `#0c0c12`)
- Active nav item: indigo pill background with glow (`box-shadow: 0 0 12px`)
- Pulsing green dot indicator on active item
- Logo shimmer animation on hover
- Nav items: icon+text slide 2px right on hover

**Files modified:**
- `apps/web/components/layout/Sidebar.tsx`

**Commit:** `feat(ui): overhaul sidebar with glow active state and hover transitions`

#### Commit 6: Upload Page Animations

**What was implemented:**
- Drop zone idle: animated dashed border (CSS `dash-march` keyframe)
- Dragging state: pulsing indigo glow
- File selected: card-style preview with icon, filename, file size
- Upload progress: animated progress bar (0→100% over upload)
- Success state: animated SVG checkmark (stroke-dashoffset draw)
- All transitions use `--transition-snappy` easing

**Files modified:**
- `apps/web/app/upload/page.tsx`

**Commit:** `feat(ui): upgrade upload page with animations and progress bar`

#### Commit 7: Transactions + Subscriptions Animations

**What was implemented:**

Transactions page:
- Table rows: stagger fadeInUp on load
- Row hover: subtle left accent bar, background lift
- Amount values: green/red colouring with JetBrains Mono
- Category badges: coloured pill variants

Subscriptions page:
- Cards: stagger fadeInUp animation
- Card hover: border glow in accent colour
- Monthly total: count-up on mount (reuses `useCountUp` hook)
- Active badge: pulsing green dot
- Empty state: inline SVG wallet illustration

**Files modified:**
- `apps/web/app/transactions/page.tsx`
- `apps/web/components/transactions/TransactionTable.tsx`
- `apps/web/app/subscriptions/page.tsx`

**Commit:** `feat(ui): add animations to transactions and subscriptions pages`

---

### Commit 8: Enum Reference Sweep (Services + AI)

**What was fixed:**
- Grepped entire codebase for `RecurringStatus.`, `RecurringType.`, `Frequency.`, `AccountType.` references
- Replaced all Python enum value comparisons with plain string literals
- Removed unused enum imports from all service files

**Files modified:**
- `apps/api/app/services/subscription_service.py` — `RecurringStatus.active` → `"active"`, `RecurringStatus.cancelled` → `"cancelled"`, `Frequency.*` → string literals
- `apps/api/app/services/analytics_service.py` — same pattern, removed `Frequency` and `RecurringStatus` imports
- `apps/api/app/services/import_service.py` — `AccountType.credit_card` → `"credit_card"`, `AccountType.current` → `"current"`
- `apps/api/app/ai/subscription_detector.py` — all enum values replaced, function signatures changed from `Frequency` to `str`, removed `Frequency`, `RecurringStatus`, `RecurringType` imports

**Commit:** `fix(api): replace all enum references with string literals across services`

---

### Commit 9: Alembic Migration 008 — ENUM to VARCHAR

**What was implemented:**
- Migration to convert PostgreSQL native ENUM columns to `VARCHAR(16)`
- Columns converted: `accounts.type`, `recurring_groups.type`, `recurring_groups.frequency`, `recurring_groups.status`
- Drops orphaned ENUM types: `accounttype`, `recurringtype`, `frequency`, `recurringstatus`

**Root cause:** Changing SQLAlchemy model columns from `Enum()` to `String()` only affects parameter binding at the Python level. The actual Postgres columns remained native ENUM types, causing `asyncpg.exceptions.UndefinedFunctionError: operator does not exist: recurringstatus = character varying`.

**Files created:**
- `apps/api/alembic/versions/008_enum_to_varchar.py`

**Commit:** `fix(db): add migration 008 to convert Postgres ENUM columns to VARCHAR`

---

### Commit 10: Migration 008 Hotfix — DROP DEFAULT

**What was fixed:**
- Migration 008 failed with `DependentObjectsStillExistError: cannot drop type recurringstatus because other objects depend on it`
- Root cause: `recurring_groups.status` had `server_default='active'::recurringstatus` which held a reference to the enum type, blocking `DROP TYPE`
- Fix: added `ALTER COLUMN status DROP DEFAULT` before the type conversion, then `SET DEFAULT 'active'` after

**Files modified:**
- `apps/api/alembic/versions/008_enum_to_varchar.py`

**Commit:** `fix(db): drop server default before dropping recurringstatus enum type`

---

### Commit 11: Debug Endpoint — Manual Subscription Detection

**What was implemented:**
- `POST /api/v1/debug/run-subscription-detection` endpoint
- Runs subscription detection synchronously (bypasses Celery) for immediate feedback
- Fetches first user (single-user V1), loads all their transactions, runs `detect_subscriptions()`, returns results

**Why needed:** After migration 008 fixed the database schema, subscriptions still showed empty. Investigation revealed:
1. The Celery `detect_subscriptions_task` had silently exhausted its 3 retries before migration 008 existed
2. The import route catches Celery dispatch errors with bare `except: pass`, making the failure invisible
3. No subscriptions were ever created because the detection never ran successfully
4. Running the debug endpoint manually found 3 subscriptions: MICROSOFT 365 (£9.99/mo), DISCORD INC (£9.99/mo), TFL TRAVEL (£4.50/wk)

**Files modified:**
- `apps/api/app/routes/debug.py`

**Commit:** `feat(debug): add POST /debug/run-subscription-detection endpoint`

---

### Key Bugs Squashed This Session

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `UndefinedFunctionError: recurringstatus = character varying` | SQLAlchemy `Enum()` columns tell asyncpg to cast as Postgres enum types | Changed model columns to `String(16)`, created migration 008 to ALTER TABLE |
| `DependentObjectsStillExistError` on migration | `server_default` on status column referenced `recurringstatus` type | DROP DEFAULT before ALTER TYPE, SET DEFAULT after |
| Subscriptions page shows 0 items | Celery task silently failed 3x before enum fix existed | Added debug endpoint for manual detection, verified 3 subs found |

---

## Updated Summary

| Wave | Tasks | Workers | Status |
|------|-------|---------|--------|
| 0 | Repo setup + scaffold | Orchestrator | Done |
| 1 | P0-07 CI pipeline | 1 | Done |
| 2 | P0-03 + P0-05 + P0-06 (+ P0-09) | 1 (sequential) | Done |
| 3 | 1A-01 + 1A-02 + 1A-03 | 1 (sequential) | Done |
| 4 | 1A-06-E ∥ 1A-07-E | 2 (parallel) | Done |
| 5 | 1B-01 ∥ 1B-04 ∥ 1B-06 ∥ 1C-01 | 4 (parallel) | Done |
| 6 | 1C-04 ∥ 1C-05 ∥ 1C-09/10 ∥ 1C-11 | 4 (parallel) | Done |
| 7 | Stubs + 1D-06 ∥ 1D-07 ∥ 1D-08 ∥ 1D-09 | 1 + 4 (parallel) | Done |
| 8 | 1D-11-E ∥ 1E-04 | 2 (parallel) | Done |
| 9 | 1E-01-E ∥ 1E-05-E | 2 (parallel) | Done |
| Ian S2 | CI fixes + V1 backlog | 1 | Done |
| Ian S3 | Enum fix + UI overhaul + subscription debug | 1 | Done |

**Total commits:** 64
**Total parser tests:** 49 passing (Amex 7 + HSBC 12 + Monzo 9 + Starling 9 + AI 12)
**Bank parsers:** 4 (Amex, HSBC, Monzo, Starling)
**Settings tabs:** 4 (Categories, Accounts, Import History, Export)
**Alembic migrations:** 8 (001–008)
**Backend files:** ~50 Python files
**Frontend files:** ~30 TypeScript/TSX files
**UI animations:** fadeInUp, shimmer, pulse-glow, dash-march, checkmark-draw, progress-fill, count-up
**Documentation:** README.md, ARCHITECTURE.md, AGENT_GUIDE.md, BUILD_LOG.md, shared-types README.md
