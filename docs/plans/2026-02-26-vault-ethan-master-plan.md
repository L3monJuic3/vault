# docs/plans/2026-02-26-vault-ethan-master-plan.md
# Vault — Ethan's Master Orchestration Plan

**Goal:** Build Vault V1 — upload bank statements, see dashboard, find subscriptions.
**Owner:** Ethan (L3monJuic3 / ethan.lane@outlook.co.nz)
**Architecture:** Next.js 15 frontend + FastAPI backend + PostgreSQL + Redis + Celery + Claude AI
**Orchestration:** Subagent-driven — max 8 Claude Code terminals (1 orchestrator + 7 workers)

---

## CRITICAL RULES

- **Never put "Co-Authored-By: Claude Code" in commit messages**
- **Never put co-authored-by claude in commit messages**
- Run tests before committing
- Follow conventional commits: `feat(scope):`, `fix(scope):`, etc.
- Check types compile after changes
- One task per worker terminal
- Orchestrator provides full task text to workers — workers never read this file

---

## Ian Dependency Tracker

These tasks are owned by Ian. Ethan's work is blocked where noted.

| Ian Task | Status | Blocks Ethan's |
|----------|--------|----------------|
| P0-02 Docker Compose | ⬜ TODO | P0-08 Deploy, P0-10 Scripts |
| P0-04 Next.js scaffold | ⬜ TODO | Nothing direct |
| 1A-04 Import model | ⬜ TODO | 1A-06 (Ian's schemas) |
| 1A-05 Insight model | ⬜ TODO | 1A-06 (Ian's schemas) |
| 1B-09 Type generation | ⬜ TODO | **1D-03, 1D-04, 1D-05 → ALL FRONTEND** |
| 1D-01 Design system | ⬜ TODO | **1D-06, 1D-07, 1D-08, 1D-09, 1D-10, 1D-11** |
| 1D-03 TanStack hooks | ⬜ TODO | **1D-04, 1D-05, 1D-06, 1D-07, 1D-08, 1D-09, 1D-10, 1D-11** |
| 1D-05 KPI cards | ⬜ TODO | **1D-06, 1D-07, 1D-08** |

### ⛔ FRONTEND HARD BLOCK

Ethan's entire Phase 1D (frontend) is blocked by three Ian deliverables:
1. **1B-09** — OpenAPI → TypeScript type generation (needs all API routes done)
2. **1D-01** — Design system + shared components
3. **1D-03** — TanStack Query hooks + API client

**If Ian hasn't completed 1B-09 + 1D-01 + 1D-03 by the time Ethan reaches Phase 1D:**
→ STOP. Return to Ethan. Report the blocker with specifics.
→ Ethan can either: (a) pair with Ian to unblock, (b) stub the deps, or (c) resequence.

---

## Execution Waves

Tasks grouped by parallelisability. Orchestrator dispatches one wave at a time.
Within a wave, workers run in parallel where safe.

---

### WAVE 0: Repository Bootstrap (Sequential — Orchestrator does this directly)

This wave is done by the orchestrator terminal directly, not dispatched to workers.

```
TASK: Repository Setup
├── Run scripts/setup-repo.sh (creates repo, sets git identity, scaffolds dirs)
├── Copy .claude/instructions.md and .claude/AGENTS.md into repo
├── Push to GitHub: git push -u origin develop
└── Verify: repo exists at github.com/L3monJuic3/vault
```

---

### WAVE 1: CI Pipeline (Must complete before any agent PRs)

CI gates must exist before workers start dispatching PRs. Without this, the entire agent workflow has no quality enforcement.

#### TASK P0-07: CI Pipeline — GitHub Actions
**Worker: T1**
**Branch:** `feat/p0-07-ci-pipeline`
**Depends on:** Wave 0 (repo exists)
**Est:** 2.5h

**Files to create:**
- `.github/workflows/ci.yml`

**Implementation:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: vault
          POSTGRES_PASSWORD: vault
          POSTGRES_DB: vault_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    defaults:
      run:
        working-directory: apps/api

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          pip install -e ".[dev]"

      - name: Lint (ruff check)
        run: ruff check .

      - name: Format check (ruff format)
        run: ruff format --check .

      - name: Type check (mypy)
        run: mypy app/ --ignore-missing-imports
        continue-on-error: true  # strict mypy can be enforced once codebase stabilises

      - name: Run tests (pytest)
        env:
          DATABASE_URL: postgresql+asyncpg://vault:vault@localhost:5432/vault_test
          DATABASE_URL_SYNC: postgresql://vault:vault@localhost:5432/vault_test
          REDIS_URL: redis://localhost:6379/0
          AUTH_REQUIRED: "false"
          APP_ENV: test
        run: pytest -v --tb=short

      - name: Check Alembic heads
        env:
          DATABASE_URL_SYNC: postgresql://vault:vault@localhost:5432/vault_test
        run: |
          HEAD_COUNT=$(alembic heads | wc -l)
          if [ "$HEAD_COUNT" -gt 1 ]; then
            echo "::error::Multiple Alembic heads detected. Run: alembic merge heads"
            exit 1
          fi

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        continue-on-error: true  # lockfile may not exist yet in early scaffold

      - name: Lint (eslint)
        run: pnpm lint
        continue-on-error: true  # frontend may not be scaffolded yet

      - name: Type check (tsc)
        run: pnpm type-check
        continue-on-error: true

      - name: Run tests (vitest)
        run: pnpm test --run
        continue-on-error: true

      - name: Build (next build)
        run: pnpm build
        continue-on-error: true

  type-freshness:
    runs-on: ubuntu-latest
    needs: [backend]
    if: always() && needs.backend.result == 'success'
    steps:
      - uses: actions/checkout@v4

      - name: Check shared-types are committed
        run: |
          if [ -d "packages/shared-types/src" ] && [ -n "$(ls packages/shared-types/src/ 2>/dev/null)" ]; then
            echo "✓ Shared types directory exists with content"
          else
            echo "⚠ No shared types generated yet — skipping freshness check"
          fi
```

**Notes on `continue-on-error`:**
- Frontend jobs use `continue-on-error: true` initially because Ian's Next.js scaffold (P0-04) may not exist yet
- Once frontend is scaffolded, these should be set to `false` (tracked as a follow-up chore)
- Backend jobs are strict from day one — no mercy

**Also update `.github/workflows/agents.yml`:**
- Ensure agents.yml `needs: [ci]` so agent quality gates only run after CI passes
- The agents.yml from the extras already handles conventional commit checks and co-author tag detection

**Acceptance criteria:**
- CI triggers on PR to develop and main
- Backend: ruff check, ruff format --check, mypy, pytest, alembic heads check
- Frontend: eslint, tsc, vitest, next build (with continue-on-error until scaffolded)
- Type freshness check runs after backend
- Alembic multi-head detection catches migration conflicts
- Postgres 16 + Redis 7 service containers for test env
- Passes on current scaffold code (health check test)

**Commit:** `ci: add GitHub Actions CI pipeline with backend + frontend + type checks`

---

### WAVE 2: FastAPI Scaffold + Core Models (1 worker, sequential — Alembic chain)

**Workers can parallel:** P0-03 runs first, then 1A models are SEQUENTIAL (Alembic chain).

#### TASK P0-03: FastAPI App Scaffold + Health Check
**Worker: T1**
**Branch:** `feat/p0-03-fastapi-scaffold`
**Est:** 1.5h

Create the FastAPI application with config, CORS, and health endpoint.

**Files to create:**
- `apps/api/app/__init__.py`
- `apps/api/app/main.py`
- `apps/api/app/config.py`
- `apps/api/app/database.py`
- `apps/api/pyproject.toml`
- `apps/api/Dockerfile`

**Acceptance criteria:**
- GET /health → `{"status": "ok"}`
- CORS allows `localhost:3000`
- App structure matches spec
- pydantic-settings for config (loads from env)
- Async setup with asyncpg

**Implementation details:**

`apps/api/pyproject.toml`:
```toml
[project]
name = "vault-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic-settings>=2.0.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "celery[redis]>=5.4.0",
    "redis>=5.0.0",
    "anthropic>=0.40.0",
    "pandas>=2.2.0",
    "pdfplumber>=0.11.0",
    "python-multipart>=0.0.9",
    "bcrypt>=4.2.0",
    "python-jose[cryptography]>=3.3.0",
    "httpx>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
    "httpx>=0.27.0",
]
```

`apps/api/app/config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    app_debug: bool = True
    database_url: str = "postgresql+asyncpg://vault:vault@localhost:5432/vault"
    database_url_sync: str = "postgresql://vault:vault@localhost:5432/vault"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production"
    auth_required: bool = False
    anthropic_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
```

`apps/api/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="Vault API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

`apps/api/app/database.py`:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID

engine = create_async_engine(settings.database_url, echo=settings.app_debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**Tests:**
```python
# apps/api/tests/test_health.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Commit:** `feat(api): scaffold FastAPI app with health check and config`

---

#### TASK P0-05: SQLAlchemy Base + User/Account Models
**Worker: T1** (after P0-03 merges)
**Branch:** `feat/p0-05-user-account-models`
**Depends on:** P0-03
**Est:** 2h

**Files to create:**
- `apps/api/app/models/__init__.py`
- `apps/api/app/models/base.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/account.py`

**Acceptance criteria:**
- Async engine connects to PostgreSQL
- Models match design spec exactly
- UUID primary keys, timestamp mixins
- Account type enum: current, savings, credit_card, investment, loan, mortgage, pension
- All enums defined

**Implementation — User model:**
```python
# apps/api/app/models/user.py
from sqlalchemy import Column, String
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    currency = Column(String(3), nullable=False, default="GBP")
```

**Implementation — Account model:**
```python
# apps/api/app/models/account.py
import enum
from sqlalchemy import Column, String, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import DECIMAL
from app.models.base import Base, TimestampMixin

class AccountType(str, enum.Enum):
    current = "current"
    savings = "savings"
    credit_card = "credit_card"
    investment = "investment"
    loan = "loan"
    mortgage = "mortgage"
    pension = "pension"

class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(AccountType), nullable=False)
    provider = Column(String, nullable=False)
    currency = Column(String(3), nullable=False, default="GBP")
    current_balance = Column(DECIMAL(12, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
```

**Commit:** `feat(models): add User and Account models with base mixins`

---

#### TASK P0-06: Alembic Init + First Migration
**Worker: T1** (after P0-05 merges)
**Branch:** `feat/p0-06-alembic-init`
**Depends on:** P0-05
**Est:** 1h

**Files to create:**
- `apps/api/alembic.ini`
- `apps/api/alembic/env.py` (async-aware)
- `apps/api/alembic/versions/001_users_and_accounts.py`

**Acceptance criteria:**
- `alembic upgrade head` works
- `alembic downgrade base` works
- Tables match models exactly
- Async env.py configuration

**Commit:** `feat(models): alembic init with users and accounts migration`

---

#### TASK P0-09: Claude Code + Agent Config (Orchestrator does directly)
**Worker: Orchestrator**
**Branch:** `chore/p0-09-agent-config`

Copy the `.claude/` files and GitHub templates into the repo.

**Files:**
- `.claude/instructions.md` (already created)
- `.claude/AGENTS.md` (already created)
- `CODEOWNERS`
- `.github/ISSUE_TEMPLATE/feature.md`
- `.github/ISSUE_TEMPLATE/bug.md`
- `.github/ISSUE_TEMPLATE/agent-task.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `docs/CONTRIBUTING.md`

**CODEOWNERS content:**
```
# Human review required
apps/api/app/models/ @L3monJuic3 @ian-github-handle
alembic/ @L3monJuic3 @ian-github-handle
docker/ @L3monJuic3 @ian-github-handle
.github/workflows/ @L3monJuic3 @ian-github-handle
.claude/ @L3monJuic3 @ian-github-handle
```

**Commit:** `chore: add Claude Code config, CODEOWNERS, issue templates`

---

### WAVE 3: Remaining Models (Sequential — Alembic chain)

These MUST be sequential to avoid Alembic branch conflicts.
One worker, one at a time.

#### TASK 1A-01: Transaction Model + Migration
**Worker: T1**
**Branch:** `feat/1a-01-transaction-model`
**Depends on:** P0-06
**Est:** 2h

Full Transaction model per design spec:
- UUID pk, account_id FK, date, description, amount (Decimal)
- balance_after (nullable), category_id FK (nullable), subcategory
- merchant_name, is_recurring, recurring_group_id FK (nullable)
- notes, tags (ARRAY of String), ai_confidence (Float, nullable)
- import_id FK, created_at
- **Composite index on (account_id, date)**

```python
# Key fields
from sqlalchemy.dialects.postgresql import ARRAY
tags = Column(ARRAY(String), nullable=False, default=[])
ai_confidence = Column(Float, nullable=True)
# Index
__table_args__ = (
    Index("ix_transactions_account_date", "account_id", "date"),
)
```

**Acceptance criteria:**
- Model matches spec exactly
- Migration clean — upgrade + downgrade work
- Composite index exists
- Tags is PostgreSQL ARRAY type
- All FKs correct

**Commit:** `feat(models): add Transaction model with composite index`

---

#### TASK 1A-02: Category Model + Seed Data
**Worker: T1** (after 1A-01)
**Branch:** `feat/1a-02-category-model`
**Depends on:** 1A-01 (migration chain)
**Est:** 1.5h

Category with self-referencing parent_id for subcategories.

**11 default categories to seed:**
| Name | Icon | Colour |
|------|------|--------|
| Housing | 🏠 | #6366F1 |
| Food & Drink | 🍔 | #F59E0B |
| Transport | 🚗 | #3B82F6 |
| Shopping | 🛍️ | #EC4899 |
| Subscriptions | 📱 | #8B5CF6 |
| Entertainment | 🎬 | #14B8A6 |
| Health | 💊 | #EF4444 |
| Education | 📚 | #06B6D4 |
| Income | 💰 | #22C55E |
| Transfers | 🔄 | #64748B |
| Other | 📋 | #94A3B8 |

**Files:**
- `apps/api/app/models/category.py`
- `apps/api/alembic/versions/003_categories.py`
- `apps/api/scripts/seed_categories.py`

**Acceptance criteria:**
- Parent/child self-reference works
- 11 defaults seeded with emoji + hex colours
- budget_monthly nullable Decimal
- System categories have `user_id = NULL`

**Commit:** `feat(models): add Category model with seed data`

---

#### TASK 1A-03: RecurringGroup Model
**Worker: T1** (after 1A-02)
**Branch:** `feat/1a-03-recurring-group-model`
**Depends on:** 1A-02 (migration chain)
**Est:** 1h

```python
class RecurringType(str, enum.Enum):
    subscription = "subscription"
    direct_debit = "direct_debit"
    standing_order = "standing_order"
    salary = "salary"

class Frequency(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"

class RecurringStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    paused = "paused"
    uncertain = "uncertain"
```

**Acceptance criteria:**
- Model matches spec
- All 3 enums defined
- FKs correct
- Migration upgrade + downgrade

**Commit:** `feat(models): add RecurringGroup model with enums`

---

### WAVE 4: Schemas + Services (2-3 workers parallel)

Ethan writes schemas and services for: User, Transaction, Category, RecurringGroup.
Ian writes: Account, Import, Insight, Analytics.

These are separate files — safe to parallel within Ethan's set.

#### TASK 1A-06-E: Pydantic Schemas (Ethan's Half)
**Worker: T2**
**Branch:** `feat/1a-06-ethan-schemas`
**Depends on:** 1A-03 (models exist)
**Est:** 1.5h

**Files to create:**
- `apps/api/app/schemas/user.py` — UserCreate, UserRead, UserUpdate
- `apps/api/app/schemas/transaction.py` — TransactionCreate, TransactionRead, TransactionUpdate, TransactionFilter, CursorPage
- `apps/api/app/schemas/category.py` — CategoryCreate, CategoryRead, CategoryUpdate
- `apps/api/app/schemas/recurring_group.py` — RecurringGroupRead, RecurringGroupUpdate
- `apps/api/app/schemas/common.py` — ErrorResponse, PaginationParams, CursorPageResponse

**Acceptance criteria:**
- Create/Update/Read variants per model
- CursorPage schema for transaction pagination
- ErrorResponse: `{"detail": "message", "code": "ERROR_CODE"}`
- Decimal serialisation works (use `float` in JSON, `Decimal` internally)
- All schemas use Pydantic v2 model_config

**Commit:** `feat(schemas): add Pydantic schemas for User, Transaction, Category, RecurringGroup`

---

#### TASK 1A-07-E: Database Service Layer (Ethan's Half)
**Worker: T3** (can parallel with T2 — different files)
**Branch:** `feat/1a-07-ethan-services`
**Depends on:** 1A-06-E (needs schemas)
**Est:** 1.5h

**Files to create:**
- `apps/api/app/services/transaction_service.py` — CRUD + cursor pagination + filters
- `apps/api/app/services/category_service.py` — CRUD + system defaults protection
- `apps/api/app/services/subscription_service.py` — CRUD + monthly total aggregation

**Acceptance criteria:**
- Async services with `get_db` dependency
- Cursor-based pagination for transactions
- Filters: date range, category, account, amount range, search (description/merchant)
- Category service prevents deletion of system defaults (user_id IS NULL)
- Subscription service calculates monthly total across all active recurring groups
- All services use SQLAlchemy 2.0 async patterns

**Commit:** `feat(services): add Transaction, Category, Subscription service layers`

---

### WAVE 5: API Routes + Celery (3-4 workers parallel)

Different route files — safe to parallel.

#### TASK 1B-01: JWT Auth Middleware
**Worker: T1**
**Branch:** `feat/1b-01-jwt-auth`
**Depends on:** 1A-07-E
**Est:** 2.5h

**Files to create:**
- `apps/api/app/routes/auth.py`
- `apps/api/app/services/auth_service.py`
- `apps/api/app/middleware/auth.py`
- `apps/api/tests/test_auth.py`

**Implementation details:**
- POST /api/v1/auth/register — create user, hash password with bcrypt
- POST /api/v1/auth/login — verify password, return JWT
- Auth dependency: `get_current_user` — extracts user from JWT
- **AUTH_REQUIRED=false env toggle** — when false, create/return a default user (V1 single-user mode)
- python-jose for JWT encoding/decoding

**Acceptance criteria:**
- Register creates user with hashed password
- Login returns JWT access token
- Protected routes reject requests without valid token
- AUTH_REQUIRED=false skips auth and returns default user
- bcrypt password hashing
- Tests for all flows

**Commit:** `feat(auth): add JWT auth with register, login, and toggle`

---

#### TASK 1B-04: Transactions Routes (Filtered, Paginated)
**Worker: T2** (parallel with T1 — different files)
**Branch:** `feat/1b-04-transaction-routes`
**Depends on:** 1A-07-E
**Est:** 3h

**Files to create:**
- `apps/api/app/routes/transactions.py`
- `apps/api/tests/test_transactions.py`

**Endpoints:**
- GET /api/v1/transactions — cursor-paginated, filterable
  - Filters: `date_from`, `date_to`, `category_id`, `account_id`, `amount_min`, `amount_max`, `search`
  - Search matches description OR merchant_name (case-insensitive)
- GET /api/v1/transactions/{id}
- PATCH /api/v1/transactions/{id} — update category, tags, notes, merchant_name
- POST /api/v1/transactions/bulk — bulk category assignment `{"transaction_ids": [...], "category_id": "..."}`

**Acceptance criteria:**
- Cursor pagination works correctly
- All 5 filter types work individually and combined
- Search is case-insensitive partial match
- PATCH supports inline category editing
- Bulk endpoint updates multiple transactions
- Tests per endpoint + combined filter tests

**Commit:** `feat(transactions): add filtered, paginated transaction routes`

---

#### TASK 1B-06: Subscriptions Routes
**Worker: T3** (parallel with T1, T2 — different files)
**Branch:** `feat/1b-06-subscription-routes`
**Depends on:** 1A-07-E
**Est:** 1.5h

**Files to create:**
- `apps/api/app/routes/subscriptions.py`
- `apps/api/tests/test_subscriptions.py`

**Endpoints:**
- GET /api/v1/subscriptions — list all + computed `monthly_total` field
- PATCH /api/v1/subscriptions/{id} — update status, cancel_url, cancel_steps
- POST /api/v1/subscriptions/{id}/dismiss — soft dismiss (sets status to cancelled)

**Acceptance criteria:**
- List includes `monthly_total` computed from all active subscriptions
- Status update works (active ↔ cancelled ↔ paused ↔ uncertain)
- Dismiss sets status to cancelled
- Tests per endpoint

**Commit:** `feat(subscriptions): add subscription list, update, and dismiss routes`

---

#### TASK 1C-01: Celery + Redis Worker Setup
**Worker: T4** (parallel — completely different files)
**Branch:** `feat/1c-01-celery-setup`
**Depends on:** P0-03
**Est:** 2h

**Files to create:**
- `apps/api/app/tasks/__init__.py`
- `apps/api/app/tasks/celery_app.py`
- `apps/api/Dockerfile.worker`

**Implementation:**
```python
# apps/api/app/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    "vault",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
    task_max_retries=3,
)

@celery_app.task(bind=True)
def health_check_task(self):
    return {"status": "ok", "task_id": self.request.id}
```

**Acceptance criteria:**
- Worker starts and connects to Redis
- Health check task executes successfully
- Docker Compose service definition ready (for Ian's docker-compose.yml)
- Retry config set (3 retries, 60s delay)

**Commit:** `feat(celery): add Celery app with Redis broker and health check task`

---

### WAVE 6: Parsers + AI Layer (3-4 workers parallel)

Different file domains — safe to parallel.

#### TASK 1C-04: CSV Parser — Amex
**Worker: T1**
**Branch:** `feat/1c-04-parser-amex`
**Depends on:** 1A-06-E (needs schemas for standardised output)
**Est:** 1.5h

**Files:**
- `apps/api/app/services/parsers/amex.py`
- `apps/api/tests/fixtures/amex_sample.csv`
- `apps/api/tests/test_parser_amex.py`

**Key detail:** Amex uses positive amounts for charges. Our system uses negative for outgoing.
Flip sign: Amex positive charge → negative amount in our system.

**Acceptance criteria:**
- Parses real Amex CSV export format
- Amounts correctly signed (charges negative, payments positive)
- All fields mapped to standardised output dict
- Unit tests with sample fixture

**Commit:** `feat(import): add Amex CSV parser with sign correction`

---

#### TASK 1C-05: CSV Parser — HSBC
**Worker: T2** (parallel)
**Branch:** `feat/1c-05-parser-hsbc`
**Depends on:** 1A-06-E
**Est:** 1.5h

**Files:**
- `apps/api/app/services/parsers/hsbc.py`
- `apps/api/tests/fixtures/hsbc_sample.csv`
- `apps/api/tests/test_parser_hsbc.py`

**Key detail:** HSBC CSVs can have multi-line descriptions and various date formats (DD/MM/YYYY).

**Acceptance criteria:**
- Parses HSBC CSV format
- Handles multi-line descriptions
- Handles DD/MM/YYYY date format
- Unit tests with sample fixture

**Commit:** `feat(import): add HSBC CSV parser with multi-line support`

---

#### TASK 1C-09: Claude AI Service Layer
**Worker: T3** (parallel — different files entirely)
**Branch:** `feat/1c-09-ai-client`
**Depends on:** P0-03
**Est:** 2.5h

**Files:**
- `apps/api/app/ai/__init__.py`
- `apps/api/app/ai/base.py`
- `apps/api/app/ai/client.py`
- `apps/api/tests/test_ai_client.py`

**Implementation:**
- Wrapper around Anthropic Python SDK
- Rate limiting (configurable, default 50 req/min)
- Cost tracking: log input_tokens, output_tokens, model, cost per call
- Retry with exponential backoff (3 attempts)
- Graceful fallback: returns None on failure, never crashes
- Structured logging of all API calls

**Acceptance criteria:**
- Wrapper class with `complete()` method
- Token usage logged per call
- Retry with exponential backoff (3 attempts, 1s/2s/4s)
- Returns None on all failures (timeout, rate limit, API error)
- Cost tracking with running totals
- Tests (mock the Anthropic client)

**Commit:** `feat(ai): add Claude API wrapper with rate limiting and cost tracking`

---

#### TASK 1C-10: AI Categorisation Service
**Worker: T3** (after 1C-09 — same domain)
**Branch:** `feat/1c-10-ai-categoriser`
**Depends on:** 1C-09, 1A-02 (categories exist)
**Est:** 3h

**Files:**
- `apps/api/app/ai/categoriser.py`
- `apps/api/app/tasks/categorise_task.py`
- `apps/api/tests/test_categoriser.py`

**Implementation:**
- Batch categorise transactions via Claude (send 20-50 at a time)
- Prompt includes category list and asks for: category_name, confidence (0-1), normalised_merchant_name
- Response parsing with validation
- Cache: merchant → category mapping (if confidence > 0.9)
- User overrides: check for manual category assignments and respect them
- Celery task wraps the service for async processing

**Acceptance criteria:**
- Batch categorisation works (mock Claude for tests)
- Merchant normalisation: "AMZN*RT5KX" → "Amazon"
- Caching per merchant (skip AI call if cached with high confidence)
- User overrides respected (manual category > AI)
- Celery task queues and processes correctly
- Tests for all paths

**Commit:** `feat(ai): add AI categorisation service with caching and Celery task`

---

#### TASK 1C-11: AI Subscription Detection
**Worker: T4** (parallel with T3's 1C-09/10 — ONLY if 1C-09 done, else after)
**Branch:** `feat/1c-11-subscription-detection`
**Depends on:** 1C-09, 1A-03
**Est:** 3h

**Files:**
- `apps/api/app/ai/subscription_detector.py`
- `apps/api/app/tasks/detect_subscriptions_task.py`
- `apps/api/tests/test_subscription_detector.py`

**Implementation:**
- Analyse transaction history to find recurring patterns
- Group by normalised merchant name, detect frequency
- Create RecurringGroup records for detected subscriptions
- Predict next expected date based on historical pattern
- Celery task for async processing

**Acceptance criteria:**
- Finds recurring transactions by merchant + amount pattern
- Groups correctly into RecurringGroups
- Detects frequency (weekly/monthly/quarterly/annual)
- Predicts next expected date
- Creates RecurringGroup records in DB
- Tests with synthetic recurring transaction data

**Commit:** `feat(ai): add AI subscription detection with frequency analysis`

---

### WAVE 7: Frontend (⚠️ IAN DEPENDENCY CHECK)

**⛔ BEFORE STARTING THIS WAVE — CHECK IAN'S STATUS:**

The orchestrator MUST verify these Ian deliverables exist and are merged to develop:
1. `1B-09` — `packages/shared-types/` has generated TypeScript types
2. `1D-01` — `apps/web/components/ui/` has design system components
3. `1D-03` — `apps/web/hooks/` has TanStack Query hooks
4. `1D-05` — `apps/web/components/dashboard/KPICards.tsx` exists

**If ANY are missing → STOP. Report to Ethan:**
```
⛔ FRONTEND BLOCKED

Missing Ian deliverables:
- [ ] 1B-09 Type generation — packages/shared-types/ empty or missing
- [ ] 1D-01 Design system — components/ui/ empty or missing
- [ ] 1D-03 TanStack hooks — hooks/use-*.ts files missing
- [ ] 1D-05 KPI cards — dashboard/KPICards.tsx missing

Cannot proceed with Ethan's frontend tasks until these are resolved.
Options:
(a) Wait for Ian
(b) Ethan stubs the dependencies
(c) Resequence — pull forward 1E-04 (demo seed data)
```

#### TASK 1D-06: Dashboard — Category Chart
**Worker: T1**
**Branch:** `feat/1d-06-category-chart`
**Depends on:** 1D-05 (Ian), 1D-01 (Ian)
**Est:** 2.5h

**Files:**
- `apps/web/components/dashboard/CategoryChart.tsx`

**Implementation:**
- Nivo or Recharts donut/pie chart
- Category colours from category data
- Click segment to filter (callback prop)
- Legend with amounts and percentages
- Tooltip on hover showing category name + amount + %
- Framer Motion entrance animation

**Acceptance criteria:**
- Donut renders with correct category colours
- Tooltip shows name + amount + percentage
- Legend with amounts
- Click interaction fires callback
- Responsive

**Commit:** `feat(dashboard): add category breakdown donut chart`

---

#### TASK 1D-07: Dashboard — Spend Timeline
**Worker: T2** (parallel — different file)
**Branch:** `feat/1d-07-spend-timeline`
**Depends on:** 1D-05 (Ian)
**Est:** 2.5h

**Files:**
- `apps/web/components/dashboard/SpendTimeline.tsx`

**Implementation:**
- Line or area chart (Recharts)
- Toggle: daily / weekly / monthly granularity
- Tooltip on hover showing date + amount
- Framer Motion entrance animation
- Green fill for positive (income), red for negative (spending)

**Acceptance criteria:**
- Chart renders with timeline data
- Granularity toggle works (daily/weekly/monthly)
- Tooltip on hover
- Animated entrance
- Responsive

**Commit:** `feat(dashboard): add spend timeline chart with granularity toggle`

---

#### TASK 1D-08: Dashboard — Recent Txns + Top Merchants
**Worker: T3** (parallel — different files)
**Branch:** `feat/1d-08-recent-txns-merchants`
**Depends on:** 1D-05 (Ian)
**Est:** 2h

**Files:**
- `apps/web/components/dashboard/RecentTransactions.tsx`
- `apps/web/components/dashboard/TopMerchants.tsx`

**Implementation:**
- Recent: last 10 transactions in compact table (date, description, amount, category badge)
- Top merchants: top 5 by total spend with amount bars
- Both link to full pages (transactions page, filtered by merchant)
- Loading skeletons

**Acceptance criteria:**
- Last 10 transactions displayed
- Top 5 merchants with totals
- Click navigates to full pages
- Loading states
- Responsive

**Commit:** `feat(dashboard): add recent transactions and top merchants widgets`

---

#### TASK 1D-09: Transactions Page — Full Table
**Worker: T4**
**Branch:** `feat/1d-09-transactions-page`
**Depends on:** 1D-01 (Ian), 1D-03 (Ian)
**Est:** 5h

**Files:**
- `apps/web/app/transactions/page.tsx`
- `apps/web/components/transactions/TransactionTable.tsx`
- `apps/web/components/transactions/TransactionFilters.tsx`
- `apps/web/components/transactions/InlineCategoryEdit.tsx`
- `apps/web/components/transactions/BulkActions.tsx`

**Implementation:**
- RSC for initial data load
- Client component for interactions
- Search bar (description + merchant)
- 4 filter types: date range, category, account, amount range
- Inline category edit with optimistic update via TanStack Query
- Cursor-based "Load more" pagination
- Bulk actions: select multiple → assign category
- Responsive (horizontal scroll on mobile)

**Acceptance criteria:**
- RSC initial load works
- Search filters in real-time
- All 4 filter types work
- Inline category edit with optimistic update
- Load more pagination
- Bulk category assignment
- Responsive at 375px

**Commit:** `feat(transactions): add full transaction table with filters and inline edit`

---

### WAVE 8: Settings + Seed Data (2 workers)

#### TASK 1D-11-E: Settings Page (Ethan's Half)
**Worker: T1**
**Branch:** `feat/1d-11-ethan-settings`
**Depends on:** 1D-01 (Ian), 1D-03 (Ian)
**Est:** 2h

Ethan builds the **Categories** and **Export** tabs.

**Files:**
- `apps/web/components/settings/CategoriesTab.tsx`
- `apps/web/components/settings/ExportTab.tsx`

**Categories tab:**
- List all categories with icon, colour, name, budget
- Create new category (name, icon, colour, parent, budget)
- Edit existing (inline)
- Delete (only user-created, not system defaults)

**Export tab:**
- Export all transactions as CSV
- Date range selector for filtered export
- Download button

**Acceptance criteria:**
- Category CRUD works
- System categories can't be deleted
- CSV export downloads correctly
- Date range filter on export

**Commit:** `feat(settings): add categories management and CSV export tabs`

---

#### TASK 1E-04: Demo Seed Data
**Worker: T2** (parallel — standalone script)
**Branch:** `feat/1e-04-demo-seed-data`
**Depends on:** 1A-07-E (services exist)
**Est:** 2h

**Files:**
- `apps/api/scripts/seed_demo_data.py`

**Implementation:**
- Generate 6 months of synthetic UK transactions (500+)
- 2 accounts: Monzo Current + Amex Gold
- UK merchants: Tesco, Sainsbury's, TfL, Amazon, Deliveroo, etc.
- 5-6 subscriptions: Netflix, Spotify, Gym, iCloud, etc.
- Monthly salary (~£3,500)
- Realistic category distribution
- Script is idempotent (check before insert)

**Acceptance criteria:**
- 500+ transactions generated
- UK merchants and amounts realistic
- 5-6 subscription patterns detectable
- Monthly salary present
- Running twice doesn't duplicate data

**Commit:** `feat(seed): add demo data generator with UK merchants and subscriptions`

---

### WAVE 9: Final Integration + Polish

#### TASK 1E-01-E: E2E Integration Tests (Ethan's portion)
**Worker: T1**
**Branch:** `feat/1e-01-integration-tests`
**Depends on:** All prior phases
**Est:** 2h

Test the full flow: Upload CSV → preview → confirm → AI categorise → check dashboard data → search → subscriptions.

**Files:**
- `apps/api/tests/integration/test_full_flow.py`
- `apps/api/tests/integration/conftest.py`

**Commit:** `test: add end-to-end integration tests for import-to-dashboard flow`

---

#### TASK 1E-05-E: README + Documentation (Ethan's portion)
**Worker: T2** (parallel)
**Branch:** `docs/1e-05-readme`
**Est:** 1h

**Files:**
- `README.md` — hero description, setup instructions, architecture diagram
- `docs/ARCHITECTURE.md` — system architecture, data flow, tech decisions

**Commit:** `docs: add README with setup instructions and architecture docs`

---

## Parallel Execution Summary

| Wave | Workers | Tasks | Notes |
|------|---------|-------|-------|
| 0 | Orchestrator | Repo setup | Sequential, orchestrator does directly |
| 1 | T1 | P0-07 CI pipeline | **Must complete before any worker PRs** |
| 2 | T1 | P0-03 → P0-05 → P0-06 | Sequential (Alembic chain) |
| 3 | T1 | 1A-01 → 1A-02 → 1A-03 | Sequential (Alembic chain) |
| 4 | T2, T3 | 1A-06-E ∥ 1A-07-E | Parallel (different files) |
| 5 | T1, T2, T3, T4 | 1B-01 ∥ 1B-04 ∥ 1B-06 ∥ 1C-01 | Parallel (different route/task files) |
| 6 | T1, T2, T3, T4 | 1C-04 ∥ 1C-05 ∥ 1C-09→1C-10 ∥ 1C-11 | Parallel with dependency chain on T3 |
| 7 | T1, T2, T3, T4 | 1D-06 ∥ 1D-07 ∥ 1D-08 ∥ 1D-09 | ⚠️ Requires Ian's 1D-01/03/05 |
| 8 | T1, T2 | 1D-11-E ∥ 1E-04 | Parallel |
| 9 | T1, T2 | 1E-01-E ∥ 1E-05-E | Parallel |
