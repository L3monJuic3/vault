# docs/AGENT_GUIDE.md
# Vault — Agent Guide

How Claude Code agents should work in this repository.

## Before Starting Any Task

1. **Read `.claude/instructions.md`** — project rules, code standards, tech stack
2. **Read `docs/ARCHITECTURE.md`** — system design and data flow (once it exists)
3. **Read the issue fully** — including acceptance criteria and affected files
4. **Check existing patterns** — look at similar code already in the repo and match it
5. **If unclear, ask** — comment on the issue rather than guessing

## Repo Conventions

### Python (apps/api/)
- Python 3.12+
- Async everywhere — `async def`, `asyncpg`, async SQLAlchemy
- Pydantic v2 for all request/response schemas
- Ruff for formatting and linting, mypy strict for types
- Tests with pytest + pytest-asyncio
- Imports: stdlib → third-party → local, alphabetical within groups

### TypeScript (apps/web/)
- Strict mode, no `any` types
- App Router — RSC for reads, `'use client'` for writes/interactions
- TanStack Query v5 for server state, Zustand for UI state only
- Tailwind v4 — use design tokens from `globals.css`, no inline styles
- Tests with vitest

### Database
- All models inherit `Base` + `TimestampMixin` (UUID pk + created_at)
- One Alembic migration per feature branch
- Never edit existing migrations
- Test both `upgrade` and `downgrade`
- Seed data in `scripts/`, not in migrations

### API
- All routes prefixed `/api/v1/`
- Pydantic models for request/response
- Error format: `{"detail": "message", "code": "ERROR_CODE"}`
- Cursor-based pagination for transactions, offset for small collections

## Picking Up a Task

```
1. Self-assign the issue on GitHub
2. Create branch: feat/<issue-number>-<slug> (from develop)
3. Read all linked context and related files
4. Implement with TDD where applicable
5. Run tests + linter + type checker
6. Commit with conventional commit message
7. Open PR linking the issue
8. Request review
```

## Branch Naming

```
feat/42-monzo-csv-parser
fix/57-duplicate-detection-hash
refactor/63-extract-ai-service
test/71-analytics-edge-cases
chore/80-update-dependencies
```

## Commit Messages

```
feat(import): add Monzo CSV parser
fix(subscriptions): correct frequency detection for quarterly payments
refactor(api): extract transaction service layer
test(analytics): add edge case tests for empty date ranges
chore(deps): update FastAPI to 0.115.2
```

**CRITICAL: Never put "Co-Authored-By: Claude Code" in commit messages.**
**Never add AI co-author tags to any commits.**

## PR Standards

- Title matches conventional commit format
- Body includes: **what** changed, **why**, **how to test**
- Must pass all CI checks before requesting review
- Keep PRs focused — one feature or fix per PR
- Max 400 lines changed — split larger work into multiple PRs

## File Ownership

Some files require human review via CODEOWNERS:

| Path | Requires |
|------|----------|
| `apps/api/app/models/` | Human review |
| `alembic/` | Human review |
| `docker/` | Human review |
| `.github/workflows/` | Human review |
| `.claude/` | Human review |

All other paths can be auto-merged after CI passes (at maintainer discretion).

## When You're Blocked

1. Label the issue `blocked`
2. Comment explaining what you're blocked on
3. If blocked by another task, link to that issue
4. Move to a different task if available
5. Don't guess or work around — wait for clarification

## Quality Expectations

- Tests for all new logic (unit + integration where appropriate)
- Error handling — no bare `except:`, no swallowed errors
- Type safety — mypy strict on Python, strict mode on TypeScript
- Edge cases — empty data, null values, malformed input
- Logging — structured logs for important operations (especially AI calls)

## AI Service Layer Rules

All Claude API interactions go through `apps/api/app/ai/`:
- Use the wrapper client (`ai/client.py`), never call Anthropic SDK directly
- Log token usage for every call
- Implement retries with backoff
- Always have a graceful fallback (return None, don't crash)
- Cache results where appropriate (merchant → category mappings)

## Adding Bank Parsers

The most common contribution path:

1. Create `apps/api/app/services/parsers/<bankname>.py`
2. Implement the standard parser interface
3. Register in the parser registry (`parsers/registry.py`)
4. Add a sample CSV/PDF in `apps/api/tests/fixtures/<bankname>_sample.csv`
5. Write unit tests in `apps/api/tests/test_parser_<bankname>.py`
6. Handle edge cases: date formats, sign conventions, multi-line descriptions
7. Submit PR with conventional commit: `feat(import): add <BankName> CSV parser`
