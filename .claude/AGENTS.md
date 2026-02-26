# .claude/AGENTS.md
# Vault — Multi-Agent Coordination Rules

## Architecture

One **Orchestrator** terminal manages up to **7 Worker** terminals (8 max total).
The Orchestrator never writes production code — it dispatches, reviews, and coordinates.

## Terminal Allocation

| Slot | Role | Scope |
|------|------|-------|
| T0 | **Orchestrator** | Reads plan, dispatches workers, manages gates |
| T1-T7 | **Workers** | One task per worker, fresh context each dispatch |

### Worker Types

| Type | Purpose |
|------|---------|
| `implementer` | Build feature to spec, TDD, self-review, commit |
| `spec-reviewer` | Verify code matches requirements (reads code, not reports) |
| `quality-reviewer` | Check architecture, quality, maintainability |
| `fixer` | Address review feedback on specific files |

## Orchestrator Responsibilities

1. Read the master plan (`docs/plans/2026-02-26-vault-ethan-master-plan.md`)
2. Extract task text — workers get FULL task content, never file references
3. Dispatch workers with focused, self-contained prompts
4. Wait for worker completion
5. Dispatch reviewers (spec first, then quality)
6. Manage fix loops until gates pass
7. Track progress via TodoWrite
8. Flag blockers (especially Ian dependencies)

## Worker Rules

### Isolation
- Each worker operates on ONE task at a time
- Workers get exactly the context they need — nothing more
- Workers must not read the master plan file (orchestrator provides task text)
- Workers must not modify files outside their task scope

### Branching
- Workers create branches: `feat/<task-id>-<slug>` or `fix/<task-id>-<slug>`
- All work branches from `develop`
- Workers commit frequently with conventional commit messages
- **Never put "Co-Authored-By: Claude Code" in commit messages**

### File Ownership (Conflict Prevention)
When multiple workers run in parallel, they MUST NOT touch the same files.

| Files | Owner Rule |
|-------|-----------|
| `apps/api/app/models/*` | ONE worker at a time, sequential |
| `alembic/versions/*` | ONE worker at a time, sequential |
| `apps/api/app/routes/*` | Different route files can be parallel |
| `apps/api/app/services/*` | Different service files can be parallel |
| `apps/api/app/schemas/*` | Different schema files can be parallel |
| `apps/web/app/*` | Different page directories can be parallel |
| `apps/web/components/*` | Different component directories can be parallel |
| `docker/*` | ONE worker at a time |
| `.github/*` | ONE worker at a time |

### Parallel Safety Matrix

Tasks that CAN run in parallel (no shared files):
```
✅ Different route files (routes/auth.py ∥ routes/accounts.py)
✅ Different service files (services/transaction.py ∥ services/import.py)
✅ Different schema files (schemas/transaction.py ∥ schemas/account.py)
✅ Different parsers (parsers/monzo.py ∥ parsers/amex.py)
✅ Different page directories (app/upload/ ∥ app/transactions/)
✅ Different component directories (components/dashboard/ ∥ components/upload/)
✅ AI service layer ∥ Parser services (no shared files)
```

Tasks that MUST be sequential (shared files):
```
🔒 Any two model/migration tasks
🔒 Any two Docker/infra tasks
🔒 Any two CI/CD tasks
🔒 Tasks touching the same page or component directory
```

## Quality Gates (Per Task)

```
Worker implements → Self-review
    ↓
Spec Reviewer dispatched → ✅ or ❌ + fix loop
    ↓
Quality Reviewer dispatched → ✅ or ❌ + fix loop
    ↓
Task marked complete
```

Skip spec review for infrastructure/config tasks (P0 scaffold, CI, Docker).
Always run quality review.

## Communication Protocol

### Worker → Orchestrator
Workers report on completion:
- What was implemented
- Files changed
- Test results (command + output)
- Self-review findings
- Blockers encountered

### Orchestrator → Worker
Dispatches include:
- Full task text (not file references)
- Relevant architectural context
- Dependencies and constraints
- Acceptance criteria
- File paths to create/modify

## Commit Convention

```
feat(scope): description     # New feature
fix(scope): description      # Bug fix
refactor(scope): description # Code restructure
test(scope): description     # Test additions
chore(scope): description    # Tooling, config
docs(scope): description     # Documentation
```

**Scopes:** import, auth, transactions, categories, subscriptions, analytics,
insights, dashboard, upload, settings, api, web, docker, ci, models, ai, celery

## CRITICAL REMINDERS

- **Never put "Co-Authored-By: Claude Code" in commit messages**
- Never put co-authored-by claude in commit messages
- Run tests before committing
- Check types compile after changes
- Follow conventional commits
- One task per worker, one PR per task
