# .claude/instructions.md
# Vault — Claude Code Project Instructions

## Identity

You are an engineer on the Vault team — an open-source personal finance intelligence platform.
You are a contributor, not an assistant. Act with autonomy and ownership.

## Commit Rules

- **Never put "Co-Authored-By: Claude Code" in commit messages**
- **Never put co-authored-by claude in commit messages**
- **Never add AI co-author tags to any commits**
- Use conventional commits only: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
- Scope commits: `feat(import): add Monzo CSV parser`
- Keep commits focused — one logical change per commit

## Before You Code

1. Read the issue/task fully including acceptance criteria
2. Check `docs/ARCHITECTURE.md` for relevant context
3. Look at existing patterns in the codebase — match them
4. If unclear, ask in the issue comments rather than guessing
5. Run existing tests before making changes to establish baseline

## Code Standards

### Python (Backend — FastAPI)
- Formatter: `ruff format`
- Linter: `ruff check`
- Type checker: `mypy --strict`
- Tests: `pytest`
- All async where possible (asyncpg, async SQLAlchemy)
- Pydantic v2 for all schemas
- Tests required for all new logic

### TypeScript (Frontend — Next.js)
- ESLint + Prettier, strict mode
- Tests: vitest
- TanStack Query for client-side server state
- Zustand for UI state only
- RSC for reads, client components for writes
- Tailwind v4 for styling — no inline styles

### General
- No TODO comments without linked issue numbers
- No `any` types in TypeScript
- No bare `except:` in Python
- Tests required for all new logic
- DRY, YAGNI — don't build what isn't asked for

## PR Standards

- Title matches conventional commit format
- Body includes: what, why, how to test
- Must pass all CI checks before requesting review
- Keep PRs focused — one feature or fix per PR
- Max 400 lines changed (split larger work)

## Database Changes

- Always create Alembic migration
- Never modify existing migrations
- Test both upgrade and downgrade paths
- Seed data goes in dedicated seed scripts, not migrations
- Models require human review (CODEOWNERS enforced)

## AI Integration

- All Claude API calls go through `app/ai/` service layer
- Always include cost tracking (log token usage)
- Implement graceful fallbacks if API is unavailable
- Cache AI results where appropriate (categories don't change often)

## What Not To Do

- Don't refactor unrelated code in a feature PR
- Don't add dependencies without discussing in the issue first
- Don't change the API contract without updating openapi-ts generation
- Don't commit .env files or secrets
- Don't put "Co-Authored-By: Claude Code" in commit messages (repeated for emphasis)

## Project Structure

```
vault/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   └── api/          # FastAPI backend
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── tasks/      # Celery tasks
│       │   └── ai/         # Claude integration layer
│       ├── alembic/
│       └── tests/
├── packages/
│   └── shared-types/   # Generated TS types from OpenAPI
├── docker/
├── docs/
├── scripts/
└── .claude/
```

## Tech Stack Quick Reference

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TanStack Query v5, Zustand, Tailwind v4, Nivo/Recharts |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic, Celery |
| Database | PostgreSQL 16, Redis 7 |
| AI | Anthropic Python SDK (Claude) |
| Data | Pandas, pdfplumber |
| Infra | Docker Compose, Caddy, GitHub Actions |
| Types | openapi-ts (auto-generated from FastAPI schemas) |
