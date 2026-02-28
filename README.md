# README.md

<div align="center">

# Vault

**Open-source personal finance platform**

Upload bank statements → AI categorises transactions → Track spending & subscriptions

[![CI](https://github.com/L3monJuic3/vault/actions/workflows/ci.yml/badge.svg)](https://github.com/L3monJuic3/vault/actions/workflows/ci.yml)

</div>

---

## What it does

Vault ingests CSV bank statements from UK banks (Amex, HSBC, Monzo, Starling), uses Claude AI to categorise transactions and detect recurring subscriptions, then presents everything in a data-dense dashboard inspired by Bloomberg Terminal aesthetics.

**V1 features:**

- CSV upload with automatic bank format detection and duplicate filtering
- AI-powered transaction categorisation (Claude, with merchant caching and confidence scores)
- AI-powered subscription detection (frequency analysis + pattern matching)
- Dashboard with KPI cards, category breakdown, spend timeline, recent transactions, top merchants
- Full transaction table with search, filters, inline category editing, and bulk actions
- Transaction detail slide-over panel
- Subscription tracking with monthly cost totals and status management
- Settings: appearance (light/dark/system + 6 accent colours), profile, categories, accounts, import history, CSV export
- Debug page with live system health monitoring and structured log viewer
- Dark mode primary with clean light mode, JetBrains Mono for financial data

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, TanStack Query, Recharts, Zustand |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic v2, Alembic |
| AI | Anthropic Claude (categorisation + subscription detection) |
| Queue | Celery + Redis |
| Database | PostgreSQL 16 |
| Fonts | Inter (body), JetBrains Mono (data) via next/font |

## Prerequisites

- Docker & Docker Compose
- An Anthropic API key (for AI features — optional, app works without it)

## Quick start

```bash
# Clone
git clone https://github.com/L3monJuic3/vault.git
cd vault

# Configure environment
cp .env.example .env
# Edit .env — set at minimum:
#   ANTHROPIC_API_KEY=sk-ant-...     (optional, enables AI categorisation)
#   NEXT_PUBLIC_API_URL=http://localhost:8080

# Start everything
docker compose up -d

# Run database migrations
docker compose exec api alembic upgrade head

# Seed default categories
docker compose exec api python -m scripts.seed_categories

# (Optional) Load demo data — 500+ synthetic UK transactions
docker compose exec api python -m scripts.seed_demo_data
```

The app will be available at `http://localhost:3000` with the API at `http://localhost:8080`.

### LAN access (homelab)

If running on a server and accessing from another machine on your network:

```bash
# In .env, set your server's LAN IP:
NEXT_PUBLIC_API_URL=http://192.168.x.x:8080
CORS_ORIGINS=http://192.168.x.x:3000
```

## Project structure

```
vault/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── ai/            # Claude AI client, categoriser, subscription detector
│   │   │   ├── middleware/     # JWT auth, request logging
│   │   │   ├── models/        # SQLAlchemy models (User, Account, Transaction, Category, RecurringGroup, Import, Insight, SystemLog)
│   │   │   ├── routes/        # API endpoints (auth, transactions, subscriptions, imports, analytics, debug)
│   │   │   ├── schemas/       # Pydantic v2 request/response schemas
│   │   │   ├── services/      # Business logic (transaction, category, subscription, import, analytics, auth, log)
│   │   │   │   └── parsers/   # Bank CSV parsers (Amex, HSBC, Monzo, Starling)
│   │   │   └── tasks/         # Celery tasks (categorisation, subscription detection)
│   │   ├── alembic/           # Database migrations (001–008)
│   │   └── tests/             # pytest suite
│   └── web/                    # Next.js 15 frontend
│       ├── app/               # Pages (dashboard, upload, transactions, subscriptions, settings, debug)
│       ├── components/
│       │   ├── ui/            # Design system (Card, Badge, Button, Input, Skeleton, EmptyState)
│       │   ├── dashboard/     # KPI cards, charts, recent transactions, top merchants
│       │   ├── transactions/  # Table, filters, inline edit, bulk actions, detail slide-over
│       │   ├── settings/      # Appearance, Profile, Categories, Accounts, Import History, Export tabs
│       │   └── layout/        # Sidebar navigation
│       └── hooks/             # TanStack Query hooks for all API endpoints
├── packages/
│   └── shared-types/          # OpenAPI → TypeScript type generation
├── docker-compose.yml
└── docs/
    ├── ARCHITECTURE.md
    └── plans/
```

## API reference

All endpoints are prefixed with `/api/v1/`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Current user profile |
| PATCH | `/auth/me` | Update name/currency |
| GET | `/transactions` | List (cursor pagination, filters) |
| PATCH | `/transactions/{id}` | Update transaction |
| POST | `/transactions/bulk` | Bulk category assignment |
| GET | `/subscriptions` | List with monthly total |
| PATCH | `/subscriptions/{id}` | Update subscription |
| POST | `/subscriptions/{id}/dismiss` | Dismiss subscription |
| POST | `/imports/upload` | Upload CSV file |
| GET | `/imports` | Import history |
| GET | `/analytics/dashboard` | KPI summary (income, expenses, net, counts) |
| GET | `/analytics/categories` | Spending by category |
| GET | `/analytics/timeline` | Spend over time |
| GET | `/analytics/top-merchants` | Top merchants by spend |
| GET | `/debug/health` | Service health (DB, Redis, Celery, AI) |
| GET | `/debug/logs` | Structured log viewer |

Interactive docs available at `/docs` (Swagger) and `/redoc`.

## Supported banks

| Bank | Format | Status |
|------|--------|--------|
| American Express | CSV | ✅ Supported |
| HSBC | CSV | ✅ Supported |
| Monzo | CSV | ✅ Supported |
| Starling | CSV | ✅ Supported |

The import service auto-detects bank format from CSV headers and filenames. Duplicate transactions are filtered using SHA-256 hashing of `(account, date, amount, description)`.

## Running tests

```bash
# Backend
cd apps/api
pip install -e ".[dev]"
pytest -v

# Frontend
cd apps/web
pnpm install
pnpm type-check
pnpm lint
```

## Development

```bash
# Regenerate TypeScript types from API schema
pnpm --filter @vault/shared-types generate

# Run backend locally (without Docker)
cd apps/api
uvicorn app.main:app --reload --port 8000

# Run frontend locally
cd apps/web
pnpm dev
```

## Database migrations

```bash
# Apply all migrations
docker compose exec api alembic upgrade head

# Create a new migration
docker compose exec api alembic revision --autogenerate -m "description"

# Check for multiple heads (CI does this automatically)
docker compose exec api alembic heads
```

Migrations 001–008 cover: users, accounts, transactions, categories, recurring groups, system logs, imports, insights, and enum-to-varchar conversion.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL async connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `ANTHROPIC_API_KEY` | No | — | Enables AI categorisation + subscription detection |
| `AUTH_REQUIRED` | No | `false` | Set `true` to require JWT auth (V1 runs in single-user mode) |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8080` | API URL for frontend |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed CORS origins |

## Licence

MIT