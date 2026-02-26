# Vault

Open-source personal finance manager. Upload bank statements, auto-categorise transactions with AI, track subscriptions, and visualise spending.

## Features

- **CSV Import** — Upload Amex and HSBC statements with automatic parsing
- **AI Categorisation** — Claude-powered transaction categorisation with merchant caching
- **Subscription Detection** — Automatically identify recurring payments and predict next charges
- **Dashboard** — Real-time spending overview with category breakdown, timeline charts, and top merchants
- **Transaction Management** — Search, filter, paginate, and bulk-edit transactions
- **Category Management** — Custom categories with budgets, plus 11 built-in defaults
- **Export** — Download filtered transactions as CSV

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TanStack Query v5, Zustand, Tailwind CSS v4, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 16, Redis 7 |
| Task Queue | Celery with Redis broker |
| AI | Anthropic Claude API |
| Monorepo | pnpm workspaces, Turborepo |

## Prerequisites

- Python 3.12+
- Node.js 20+ and pnpm 9+
- PostgreSQL 16
- Redis 7

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/L3monJuic3/vault.git
cd vault
pnpm install
cd apps/api && pip install -e ".[dev]"
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials and Anthropic API key
```

### 3. Run database migrations

```bash
cd apps/api
alembic upgrade head
python scripts/seed_categories.py  # Seed default categories
python scripts/seed_demo_data.py   # Optional: load demo data
```

### 4. Start services

```bash
# Terminal 1: API server
cd apps/api && uvicorn app.main:app --reload

# Terminal 2: Celery worker
cd apps/api && celery -A app.tasks.celery_app worker --loglevel=info

# Terminal 3: Frontend
cd apps/web && pnpm dev
```

Visit http://localhost:3000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login and get JWT |
| GET | /api/v1/transactions | List transactions (cursor pagination) |
| GET | /api/v1/transactions/:id | Get single transaction |
| PATCH | /api/v1/transactions/:id | Update transaction |
| POST | /api/v1/transactions/bulk | Bulk category assignment |
| GET | /api/v1/subscriptions | List subscriptions + monthly total |
| PATCH | /api/v1/subscriptions/:id | Update subscription |
| POST | /api/v1/subscriptions/:id/dismiss | Dismiss subscription |

## Project Structure

```
vault/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── ai/            # Claude AI integration
│   │   │   ├── middleware/    # Auth middleware
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   ├── routes/        # API route handlers
│   │   │   ├── schemas/       # Pydantic v2 schemas
│   │   │   ├── services/      # Business logic
│   │   │   │   └── parsers/   # CSV parsers (Amex, HSBC)
│   │   │   └── tasks/         # Celery async tasks
│   │   ├── alembic/           # Database migrations
│   │   ├── scripts/           # Seed scripts
│   │   └── tests/             # pytest test suite
│   └── web/                    # Next.js 15 frontend
│       ├── app/               # App Router pages
│       ├── components/        # React components
│       │   ├── dashboard/     # Dashboard widgets
│       │   ├── transactions/  # Transaction views
│       │   ├── settings/      # Settings panels
│       │   └── ui/            # Design system
│       ├── hooks/             # TanStack Query hooks
│       └── lib/               # Utilities
└── packages/
    └── shared-types/          # TypeScript interfaces
```

## Running Tests

```bash
# Backend
cd apps/api
python -m pytest tests/ -v

# Frontend
cd apps/web
pnpm test

# Linting
cd apps/api && ruff check . && ruff format --check .
cd apps/web && pnpm lint
```

## Licence

MIT
