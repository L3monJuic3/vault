
---

## Post-V1 Session: Debug System + Import Pipeline

**Date:** 2026-02-27 (continued)
**Session focus:** Homelab deployment fixes, debug/observability system, real import pipeline

---

## Wave 7: Homelab Deployment Fixes

### docker-compose.yml — PYTHONPATH fix

**Problem:** `vault-migrate-1` was failing with `ModuleNotFoundError: No module named 'app'` because alembic's `env.py` imports `app.config` but `/app` wasn't on the Python path inside the container.

**Fix:** Added `PYTHONPATH: /app` to both `migrate` and `api` service environments in `docker-compose.yml`.

### docker-compose.yml — Port conflict fix

**Problem:** Portainer was already using port 8000 on SystemShock. The `api` service port mapping `8000:8000` caused a bind failure.

**Fix:** Changed API port mapping to `8080:8000`. Updated `NEXT_PUBLIC_API_URL` to `http://localhost:8080`.

### docker-compose.yml — CORS + API URL fix

**Problem:** `NEXT_PUBLIC_API_URL` was set to `http://localhost:8080` which only resolves correctly when the browser is running on the server. Accessing from Windows at `192.168.68.56:3000` meant all API calls hit `localhost` on the Windows machine (which has no API).

**Fix:** Hardcoded `NEXT_PUBLIC_API_URL: http://192.168.68.56:8080` in `docker-compose.yml` for local network access. Updated `CORS_ORIGINS` in the api service to `http://192.168.68.56:3000`.

**Long-term fix:** Made `NEXT_PUBLIC_API_URL` use env var interpolation with localhost fallback: `${NEXT_PUBLIC_API_URL:-http://localhost:8080}`. This means the `.env` file on any server controls the value without changing docker-compose.

---

## Wave 8: Debug & Observability System

### Task I-20: SystemLog model + migration

**Files created:**
- `apps/api/app/models/system_log.py`
- `apps/api/alembic/versions/005_system_logs.py`

**Schema:**
```
system_logs
  id          UUID PK
  level       VARCHAR(16)   — DEBUG INFO WARNING ERROR CRITICAL
  category    VARCHAR(32)   — http parse ai auth system task
  message     TEXT
  detail      JSONB         — full request/response/traceback context
  created_at  TIMESTAMPTZ
```
Indexed on: `level`, `category`, `created_at`

### Task I-21: Log service

**File created:** `apps/api/app/services/log_service.py`

`write_log()`, `get_logs()` (level/category filter, newest first), `get_log_counts()` for summary strip.

### Task I-22: Request logging middleware

**File created:** `apps/api/app/middleware/logging.py`

`RequestLoggingMiddleware` (Starlette `BaseHTTPMiddleware`) intercepts every request:
- Logs `INFO` for 2xx, `WARNING` for 4xx, `ERROR` for 5xx
- Captures: method, path, query, status code, duration ms, client IP
- On unhandled exceptions: logs full Python traceback in `detail.traceback`
- Uses independent DB session (`AsyncSessionLocal`) so logging never interferes with the request session
- Skips: `/health`, `/openapi.json`, `/docs`, `/redoc`

### Task I-23: Debug routes

**File created:** `apps/api/app/routes/debug.py`

```
GET  /api/v1/debug/health       — detailed service health (DB, Redis, Celery, AI)
GET  /api/v1/debug/logs         — paginated log history, filterable by level/category
DELETE /api/v1/debug/logs       — clear all logs
POST /api/v1/debug/logs/test    — write test entry to verify pipeline
```

Health check tests each service and returns latency + error detail:
- **Database**: `SELECT 1` round-trip
- **Redis**: `PING` via `redis.asyncio`
- **Celery**: `celery_app.control.inspect().ping()` with 2s timeout
- **AI**: Checks `ANTHROPIC_API_KEY` presence

### Task I-24: Debug frontend page + hook

**Files created:**
- `apps/web/hooks/use-debug.ts` — `useHealth()`, `useLogs()`, `useClearLogs()`, `useTestLog()`
- `apps/web/app/debug/page.tsx` — full debug UI

**UI features:**
- Overall system status banner with live indicator
- 4 service health cards with latency and error detail
- Log count strip (click to filter by level)
- Category filter tabs (ALL / http / parse / ai / auth / system / task)
- Live log table with level badge, category, message, timestamp
- Click any row to expand full JSON detail and traceback
- LIVE / PAUSED toggle (5s auto-refresh when live)
- Test log button, Clear logs button

**Sidebar:** Added Debug nav item with BugIcon.

---

## Wave 9: Import Pipeline (1A-04)

This was the outstanding task from the original V1 plan. The upload page was previously faking the API call with `setTimeout`.

### Task I-25: Import model + migration

**Files created:**
- `apps/api/app/models/import_record.py`
- `apps/api/alembic/versions/006_imports.py`

**Schema (matches design spec exactly):**
```
imports
  id                  UUID PK
  user_id             FK(users)
  account_id          FK(accounts)
  filename            VARCHAR
  file_type           VARCHAR(8)    — csv pdf ofx qif
  row_count           INTEGER
  duplicates_skipped  INTEGER
  date_range_start    DATE
  date_range_end      DATE
  status              VARCHAR(16)   — processing completed failed
  error_message       TEXT
  created_at          TIMESTAMPTZ
```

Migration 006 also adds the FK constraint from `transactions.import_id → imports.id` (`ON DELETE SET NULL`) that was intentionally deferred until the imports table existed.

### Task I-26: Import service

**File created:** `apps/api/app/services/import_service.py`

Three responsibilities:

**Format detection (`detect_format`):**
- Inspects first CSV header line for known column patterns
- Amex: `Date, Description, Amount` (no balance column)
- HSBC: `Paid Out / Paid In` columns OR `Balance` column present
- Filename fallback: `amex` / `hsbc` in filename
- Returns `None` if unknown → route returns 422 with helpful message

**Duplicate detection:**
- SHA-256 hash of `(account_id, date, amount, description)`
- Loads all existing hashes for the account in a single query before processing
- Also deduplicates within the same file (handles re-uploaded statements)

**`process_import(db, user_id, filename, content)`:**
1. Detect format, select parser
2. Parse all rows
3. `get_or_create_account()` — finds existing account by `provider` or creates one (Amex → `credit_card`, HSBC → `current`)
4. Create `Import` record with `status=processing`, flush to get ID
5. Deduplicate rows, build `Transaction` objects with `import_id` set
6. Update import record: `row_count`, `duplicates_skipped`, `status=completed`, `date_range_start/end`
7. Update `account.current_balance` to latest `balance_after` if present (HSBC has this, Amex doesn't)
8. `db.commit()` once — single transaction for the whole import
9. Returns `(import_record, transaction_ids)` — caller triggers Celery tasks

### Task I-27: Import routes

**File created:** `apps/api/app/routes/imports.py`

```
POST /api/v1/imports/upload    — multipart CSV upload, returns ImportRead (201)
GET  /api/v1/imports           — list all imports, newest first
GET  /api/v1/imports/{id}      — get single import record
```

Upload route:
- Reads file bytes, decodes UTF-8 with latin-1 fallback (some older bank exports)
- Calls `process_import()`, wraps `ValueError` as HTTP 422
- Fires `categorise_transactions_task.delay()` and `detect_subscriptions_task.delay()` after successful import
- Tasks are best-effort — if Celery is down, upload still succeeds

**What this unblocks:**
- Upload page now actually saves data to the database
- AI categorisation runs automatically after each upload
- Subscription detection runs after each upload
- Dashboard widgets will populate after first upload

### Task I-28: Upload page — real API

**File modified:** `apps/web/app/upload/page.tsx`

Replaced `setTimeout` simulation with real `fetch()` call to `POST /api/v1/imports/upload`.

**Changes:**
- `FormData` construction and `fetch` to `${API_BASE}/api/v1/imports/upload`
- Error handling: displays the API's `detail` message on failure
- Success state: shows actual `row_count` and `duplicates_skipped` from response
- On success: `queryClient.invalidateQueries()` for `dashboard`, `transactions`, `subscriptions` — forces all widgets to refetch with new data
- Removed PDF from `accept` attribute — only CSV supported in V1

---

## Updated Outstanding Work (V1 remainder)

| Task | What it is |
|------|-----------|
| `1A-05` Insight model | SQLAlchemy model + Alembic migration for `insights` table |
| Accounts tab in Settings | Settings page has no Accounts tab yet |
| Import history tab in Settings | No UI to view past imports |
| Type generation pipeline | Real `openapi-ts` run replacing manual stubs |
| Monzo CSV parser | Additional bank format |
| Starling CSV parser | Additional bank format |
| 3 Ethan lint issues | `input.tsx` error, 2 warnings |

---

## Hotfix: Default User Race Condition

**File modified:** `apps/api/app/middleware/auth.py`

**Bug:** On a fresh database, multiple concurrent requests (dashboard loading 4+ widgets simultaneously) all hit `get_current_user` at the same time. Each sees `user is None` and tries to `INSERT` the default user. The first succeeds; all others throw `UniqueViolationError: duplicate key value violates unique constraint "ix_users_email"`. This caused all analytics endpoints to return 500 on first load.

**Caught by:** Debug page — `IntegrityError` visible in the log stream immediately after first load.

**Fix:** Replaced `SELECT → INSERT` pattern with PostgreSQL `INSERT ... ON CONFLICT DO NOTHING` (upsert). All concurrent requests attempt the insert; only one wins, the rest silently skip. A single `SELECT` after the upsert returns the user for all of them.

```python
stmt = (
    insert(User)
    .values(email="default@vault.local", ...)
    .on_conflict_do_nothing(index_elements=["email"])
)
await db.execute(stmt)
await db.flush()
result = await db.execute(select(User).where(User.email == "default@vault.local"))
return result.scalar_one()
```

**Note:** This is Ethan's file — only the single-user mode block was changed. Auth-required path is untouched.
