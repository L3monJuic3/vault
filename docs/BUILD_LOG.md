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
