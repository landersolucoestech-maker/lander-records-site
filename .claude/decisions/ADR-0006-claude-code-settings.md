# ADR-0006 — Claude Code settings files at the top of `.claude/`

- Status: ACCEPTED
- Date: 2026-09-25

## Context
The canonical layout (ADR-0005) froze the top level of `.claude/`. Claude Code itself reads `.claude/settings.json` (project hooks/permissions) and writes `.claude/settings.local.json` (per-user permissions). Rejecting them made `pack.mjs` fail as soon as a user approved a permission, and left the guardians without enforcement.

## Decision
- `settings.json` and `settings.local.json` are allowed top-level entries (Claude Code native configuration); `settings.local.json` is git-ignored.
- `settings.json` registers `runtime/hooks/guard-bash.mjs` as a `PreToolUse` hook for Bash. It blocks destructive git (reset --hard, clean -f, force push, branch -D, bulk checkout/restore, history rewrite), recursive deletes of repository state, destructive SQL outside local `*_test` databases, dumping env files/environment, and `db:migrate` against non-local databases.
- Roles outside `.claude/agents/` are launched with `runtime/dispatch.mjs <role>` (prompt for Claude Code's Agent tool).

## Consequences
Guardians are enforced, not only documented. The hook is advisory-proof but not a sandbox: an operator can still authorize an exception explicitly in conversation.
