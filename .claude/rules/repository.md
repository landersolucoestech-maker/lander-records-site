# repository rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Single Next.js app at repo root (no workspaces); npm with package-lock.json; node >=24 <25 (.nvmrc).
- Layering: app/ (routes, UI, server actions) → modules/* (domain facades) → lib/* (services, integrations, db) → lib/db (Drizzle schema).
- `@/` alias maps to repo root (tsconfig paths).
- Mock data only via LANDER_MOCK_DATA for the disposable preview; never in production.
- Generated/runtime dirs ignored: .next, .local, test-results, playwright-report, .claude/state/.run.
- Banned origin/platform tokens are enforced by scripts/check-legacy-origin.mjs in CI.
