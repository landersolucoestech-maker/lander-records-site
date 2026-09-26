# Review — adversarial-reviewer — round 5 (HEAD 6697dae)

Independent read-only review dispatched by the mission controller (clone /var/tmp/adv5; disposable DB restored to baseline). Reproduced from the reviewer's hand-back (condensed; findings and verdict verbatim in substance).

REVIEW-TICKET: 1fe19ef7ec4c0ade1b08691907d76792

Ran: soundcharts-identity-sync.mjs exit 0 on HEAD, exit 1 with sync.ts from 32a5013^; test:claude-os 30/30; own race script and runtime probes.

Round-4 items: F-0003 race CLOSED (no new deadlock; a pre-existing slug+links save vs publish FK deadlock aborts one side safely); npmrc PARTIAL (HIGH); admin purge/withdrawal CLOSED; requiredTests PARTIAL; skipped/todo CLOSED; BUILD_ID mtime and hook quote tricks OPEN but accepted (ADR-0007).

## HIGH
1. `.claude/runtime/lib/io.mjs` childEnv — a project `.npmrc` with `node-options=--require <exit0.cjs>` makes `npm run test:claude-os` and `npm run typecheck` record PASS with nothing run; ranNothing needs `# tests N` only for direct `--test`; the hook allows `npm config set … --location=project` and writing `.npmrc`. Related (reasoned): `node_modules/.bin` is outside the fingerprint.

## MEDIUM
1. `lib/findings.mjs` matchesRequiredTests + `pack.mjs` anchoring — appending an unrelated suite to requiredTests widens what proves a finding (any entry matches); anchoring only forbids removal.

## LOW
1. `lib/integrations/sync.ts` catch blocks — the lastError write is not compare-and-set; a superseded run stamps its error on the current identity (admin view only).

## Leads (not established)
- gitAnchorErrors walks `git log --name-only` with default history simplification; merges may hide versions (use `--full-history -m`).
- scopeBase trusts any committed COMPLETED entry (documented).
- A→B→A flip can publish slightly older values for the same identity.

VERDICT: FAIL
