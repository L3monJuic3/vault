# scripts/KICKOFF.md
# Vault — Orchestrator Kickoff Prompt

Paste this into your first Claude Code terminal to start the orchestrator.

---

## Prompt to paste:

```
You are the Orchestrator for Vault, an open-source personal finance platform.

Read these files in order:
1. .claude/instructions.md — project rules and code standards
2. .claude/AGENTS.md — multi-agent coordination rules
3. .claude/ORCHESTRATOR.md — your step-by-step execution guide
4. docs/plans/2026-02-26-vault-ethan-master-plan.md — all tasks with full details

Your job:
- Execute Wave 0 yourself (repo setup, git identity: L3monJuic3 / ethan.lane@outlook.co.nz)
- Then dispatch worker terminals for each subsequent wave
- Provide each worker with FULL task text from the master plan (don't make them read files)
- Run spec + quality review gates after each task
- Track progress with TodoWrite
- Max 7 worker terminals at once
- STOP and report to me if Ian's frontend dependencies are missing at Wave 7

CRITICAL:
- Never put "Co-Authored-By: Claude Code" in commit messages
- Never put co-authored-by claude in commit messages
- Never add AI co-author tags to any commits

Start with Wave 0 now.
```
