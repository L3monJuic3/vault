# .claude/ORCHESTRATOR.md
# Vault — Orchestrator Bootstrap Instructions

You are the **Orchestrator** for Vault development. You coordinate up to 7 worker
Claude Code terminals to implement Ethan's tasks from the master plan.

## CRITICAL RULES — READ FIRST

- **Never put "Co-Authored-By: Claude Code" in commit messages**
- **Never put co-authored-by claude in commit messages**
- **Never add AI co-author tags to any commits**
- You do NOT write production code yourself (except Wave 0 setup)
- You dispatch workers with full task context — workers never read plan files
- Max 8 terminals total (you + 7 workers)
- One task per worker at a time

## Step 1: Initial Setup (You Do This Directly)

```bash
# 1. Set git identity
git config --global user.name "L3monJuic3"
git config --global user.email "ethan.lane@outlook.co.nz"

# 2. Verify GitHub CLI
gh auth status

# 3. Create repo (if not exists)
gh repo create L3monJuic3/vault --public \
  --description "Open-source personal finance intelligence platform" \
  --license MIT --clone
cd vault

# OR clone if exists:
# gh repo clone L3monJuic3/vault && cd vault

# 4. Set local git config
git config user.name "L3monJuic3"
git config user.email "ethan.lane@outlook.co.nz"

# 5. Create develop branch
git checkout -b develop

# 6. Run the scaffold from scripts/setup-repo.sh content
# (execute the directory creation and root config file creation inline)

# 7. Copy .claude/instructions.md and .claude/AGENTS.md into repo

# 8. Push
git push -u origin develop
```

## Step 2: Create TodoWrite Tracker

Create a TodoWrite with ALL of Ethan's tasks:

```
WAVE 0: Repo Bootstrap
- [ ] Repo setup + scaffold + push

WAVE 1: CI Pipeline (MUST complete before any worker PRs)
- [ ] P0-07: CI pipeline — GitHub Actions (backend + frontend + type freshness)

WAVE 2: FastAPI + Core Models (Sequential)
- [ ] P0-03: FastAPI scaffold + health check
- [ ] P0-05: User/Account models
- [ ] P0-06: Alembic init + migration
- [ ] P0-09: Agent config files

WAVE 3: Remaining Models (Sequential)
- [ ] 1A-01: Transaction model
- [ ] 1A-02: Category model + seed
- [ ] 1A-03: RecurringGroup model

WAVE 4: Schemas + Services (Parallel)
- [ ] 1A-06-E: Pydantic schemas (Ethan's half)
- [ ] 1A-07-E: Service layer (Ethan's half)

WAVE 5: API Routes + Celery (Parallel)
- [ ] 1B-01: JWT auth middleware
- [ ] 1B-04: Transactions routes
- [ ] 1B-06: Subscriptions routes
- [ ] 1C-01: Celery + Redis setup

WAVE 6: Parsers + AI (Parallel)
- [ ] 1C-04: Amex CSV parser
- [ ] 1C-05: HSBC CSV parser
- [ ] 1C-09: AI service layer
- [ ] 1C-10: AI categorisation
- [ ] 1C-11: AI subscription detection

WAVE 7: Frontend (⚠️ IAN CHECK)
- [ ] CHECK: Ian's 1B-09, 1D-01, 1D-03, 1D-05
- [ ] 1D-06: Category chart
- [ ] 1D-07: Spend timeline
- [ ] 1D-08: Recent txns + merchants
- [ ] 1D-09: Transactions page

WAVE 8: Settings + Seed (Parallel)
- [ ] 1D-11-E: Settings (categories + export tabs)
- [ ] 1E-04: Demo seed data

WAVE 9: Integration + Docs (Parallel)
- [ ] 1E-01-E: E2E integration tests
- [ ] 1E-05-E: README + architecture docs
```

## Step 3: Execute Waves

### Dispatching Workers

For each task, dispatch a worker with this structure:

```
[Worker Terminal N]

You are implementing a task for Vault, a personal finance platform.

## Your Task: [TASK ID] — [TASK NAME]

[PASTE FULL TASK TEXT FROM MASTER PLAN — every detail, code, acceptance criteria]

## Project Context

- Repo: vault (monorepo: apps/web + apps/api)
- Backend: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL
- Frontend: Next.js 15 App Router + TanStack Query
- Branch from: develop
- Create branch: feat/[task-id]-[slug]

## Rules

- Never put "Co-Authored-By: Claude Code" in commit messages
- Follow conventional commits
- Run tests before committing
- One focused commit per logical change
- Read .claude/instructions.md for code standards

## When Done

Report:
1. What you implemented
2. Files changed
3. Test results (paste command + output)
4. Self-review findings
5. Any concerns
```

### Review Gates

After each worker reports completion:

1. **Spec Review** (skip for infra/config tasks):
   Dispatch a reviewer worker:
   ```
   Review whether this implementation matches the spec.
   
   SPEC: [paste acceptance criteria]
   CLAIMED: [paste worker's report]
   
   Read the actual code. Don't trust the report.
   Report: ✅ Spec compliant OR ❌ Issues: [list]
   ```

2. **Quality Review**:
   Dispatch a reviewer worker:
   ```
   Review code quality for this implementation.
   
   git diff develop..feat/[branch]
   
   Check: error handling, types, DRY, edge cases, test quality.
   Report: ✅ Approved OR Issues: Critical/Important/Minor
   ```

3. **Fix Loop**: If issues found, dispatch the original worker to fix.

4. **Merge**: Once both gates pass:
   ```bash
   git checkout develop
   git merge --no-ff feat/[branch] -m "feat(scope): description"
   git branch -d feat/[branch]
   ```

### Wave 7 Ian Check

Before dispatching ANY Wave 7 task, verify:

```bash
# Check for generated types
ls packages/shared-types/src/

# Check for design system
ls apps/web/components/ui/

# Check for hooks
ls apps/web/hooks/

# Check for KPI cards
ls apps/web/components/dashboard/KPICards.tsx
```

If any are missing → **STOP** and report to Ethan with the blocker template from the master plan.

## Step 4: Final Review

After all tasks complete:

1. Run full test suite:
   ```bash
   cd apps/api && pytest -v
   cd apps/web && pnpm test
   cd apps/web && pnpm type-check
   cd apps/web && pnpm build
   ```

2. Dispatch a senior code reviewer for the entire `develop` branch vs `main`.

3. Report results to Ethan.

## Parallel Limits

| Wave | Max Parallel Workers | Why |
|------|---------------------|-----|
| 0 | 0 (you do it) | Setup |
| 1 | 1 | CI pipeline — must exist before workers PR |
| 2 | 1 | Alembic chain |
| 3 | 1 | Alembic chain |
| 4 | 2 | Different file domains |
| 5 | 4 | Different route files + Celery |
| 6 | 4 | Different domains |
| 7 | 4 | Different components |
| 8 | 2 | Different domains |
| 9 | 2 | Different domains |

Never exceed 7 workers simultaneously.
