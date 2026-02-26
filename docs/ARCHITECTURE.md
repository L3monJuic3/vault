# Architecture

## Overview

Vault follows a monorepo architecture with a clear separation between the Next.js frontend and FastAPI backend, communicating via REST API.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Next.js 15    │────▶│   FastAPI         │────▶│ PostgreSQL  │
│   (React 19)    │     │   (async)         │     │ 16          │
│   Port 3000     │     │   Port 8000       │     └─────────────┘
└─────────────────┘     └──────┬───────────┘
                               │
                        ┌──────▼───────────┐     ┌─────────────┐
                        │   Celery Worker   │────▶│   Redis 7   │
                        │   (background)    │◀────│   (broker)  │
                        └──────┬───────────┘     └─────────────┘
                               │
                        ┌──────▼───────────┐
                        │   Claude API      │
                        │   (categorise)    │
                        └──────────────────┘
```

## Data Flow

### CSV Import Flow
1. User uploads CSV file via frontend
2. Parser (Amex/HSBC) extracts transactions
3. Transactions saved to PostgreSQL
4. Celery task dispatched for AI categorisation
5. Claude categorises transactions in batches
6. Results written back with ai_confidence scores
7. Frontend updates via TanStack Query invalidation

### Subscription Detection Flow
1. Celery task analyses transaction history
2. Groups transactions by merchant + similar amounts
3. AI determines frequency (weekly/monthly/quarterly/yearly)
4. Predicts next charge date
5. Creates RecurringGroup records

## Database Schema

### Core Models
- **User** — email, name, password_hash, currency (GBP/USD/EUR/NZD)
- **Account** — name, institution, type (checking/savings/credit), balance
- **Transaction** — date, amount, description, merchant, category, tags[], ai_confidence
- **Category** — name, colour, icon, budget_monthly, is_system, parent_id (self-referencing)
- **RecurringGroup** — merchant, amount, frequency, next_date, status, type (subscription/income/transfer)

### Key Design Decisions
- **UUID primary keys** — Avoids sequential ID enumeration
- **TimestampMixin** — All models get `id` (UUID) and `created_at` automatically
- **ARRAY tags** — PostgreSQL native array for flexible transaction tagging
- **Cursor pagination** — Efficient for large transaction sets (no OFFSET)
- **Composite index** — `(user_id, date DESC, id)` for fast transaction queries

## AI Integration

### Client (`app/ai/client.py`)
- Rate limiting with configurable RPM
- Token usage tracking with cost calculation
- Retry with exponential backoff
- Graceful fallback on API errors

### Categoriser (`app/ai/categoriser.py`)
- Batch processing (configurable batch size)
- Merchant → category cache (avoids re-categorising known merchants)
- Respects user overrides (manually categorised transactions not re-processed)
- Returns confidence scores (0.0 - 1.0)

### Subscription Detector (`app/ai/subscription_detector.py`)
- Frequency detection from transaction patterns
- Next date prediction
- Amount variance tolerance

## Authentication

Two modes via `AUTH_REQUIRED` environment variable:
- **`false` (default)** — Single-user mode. Auto-creates a default user. No login required.
- **`true`** — Multi-user mode. JWT Bearer tokens required. Tokens issued on login with configurable expiry.

## Task Queue

Celery with Redis broker handles:
- **AI Categorisation** — Background batch processing after CSV import
- **Subscription Detection** — Periodic analysis of transaction patterns

Configuration: JSON serialisation, late acknowledgement, 3 retries with exponential backoff.

## Frontend Architecture

### State Management
- **Server state** — TanStack Query v5 (caching, invalidation, optimistic updates)
- **Client state** — Zustand (minimal, UI-only state)

### Component Hierarchy
```
Layout
├── Dashboard (/)
│   ├── KPICards (balance, income, spending, subscriptions)
│   ├── CategoryChart (donut chart)
│   ├── SpendTimeline (area chart)
│   ├── RecentTransactions
│   └── TopMerchants
├── Transactions (/transactions)
│   ├── TransactionFilters
│   ├── TransactionTable
│   ├── InlineCategoryEdit
│   └── BulkActions
└── Settings (/settings)
    ├── CategoriesTab
    └── ExportTab
```
