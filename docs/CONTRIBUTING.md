# Contributing to Vault

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch from `develop`
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Backend
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Frontend
cd apps/web
pnpm install

# Database
# Ensure PostgreSQL 16 and Redis 7 are running
alembic upgrade head
```

## Code Standards

See `.claude/instructions.md` for full details.

### Python
- Ruff for formatting and linting
- mypy strict for type checking
- pytest for tests
- Async everywhere

### TypeScript
- ESLint + Prettier, strict mode
- vitest for tests
- No `any` types

## Commit Messages

Use conventional commits:
```
feat(scope): description
fix(scope): description
refactor(scope): description
test(scope): description
chore(scope): description
docs(scope): description
```

## Pull Requests

- One feature/fix per PR
- Max 400 lines changed
- Must pass CI before review
- Include: what, why, how to test
