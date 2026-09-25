# ADR-0006 — Claude Code settings files at the top of `.claude/`

- Status: ACCEPTED
- Date: 2026-09-25

## Context
The canonical layout (ADR-0005) froze the top level of `.claude/`. Claude Code itself reads `.claude/settings.json` (project hooks/permissions) and writes `.claude/settings.local.json` (per-user permissions). Rejecting them made `pack.mjs` fail as soon as a user approved a permission, and left the guardians without enforcement.

## Decision
- `settings.json` and `settings.local.json` are allowed top-level entries (Claude Code native configuration); `settings.local.json` is git-ignored.
- `settings.json` registers `runtime/hooks/guard-bash.mjs` as a `PreToolUse` hook for Bash, as `node … || exit 2` so a missing or crashing hook blocks instead of passing. It parses each command segment — recursing into `sh|bash -c` (including `-lc` and `-c --`), `eval`, `$(…)`, backticks and here-strings, and tracking `cd` / `$(pwd)` — and blocks git alias definitions (inline `-c alias.*` or `config alias.*`, which could hide any subcommand), destructive git subcommands (reset --hard, clean -f, any `--force*` push including `--force-with-lease`, `+`/`:` refspecs, branch -D, update-ref, checkout/restore of `.` or a directory, switch --discard-changes, stash clear/drop, history rewrite), `find -delete`/`-exec rm`/`-execdir rm` over repository paths (paths resolved), recursive deletes of repository/home state (incl. `..` and absolute paths to the repository root or its ancestors), destructive SQL unless every connection target is local and the database is `*_test`, reading env files (including globs) or dumping the environment (`env`, `printenv`, `export -p`, `/proc/*/environ`, `process.env` / `os.environ` dumps), and migrations unless `DATABASE_URL` is set inline to a local host. Tests: `runtime/tests/hooks.test.mjs`.
- Roles outside `.claude/agents/` are launched with `runtime/dispatch.mjs <role>` (prompt for Claude Code's Agent tool).

## Consequences
Guardians have a real enforcement point instead of prose only. The hook fails closed on unreadable input but is a guardrail, not a sandbox: it parses common shell forms and can be evaded by unusual constructs (ADR-0007); an operator can still authorize an exception explicitly in conversation.
