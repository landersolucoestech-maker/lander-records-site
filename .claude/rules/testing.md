# testing rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Unit: node --test (tests/unit, tests/auth, tests/database, tests/spotify-security.test.cjs) — `npm test`.
- Integration (DB): tests/integration/*.mjs — `npm run test:integration` with DATABASE_URL to local *_test; server modules loaded via tests/support/ts-resolve-hooks.mjs; provider HTTP doubled, DB real.
- Browser: Playwright tests/browser against a built server (PLAYWRIGHT_BASE_URL); contact spec opt-in E2E_CONTACT_SUBMIT=1.
- Bug fixes need a test that fails on the base commit.
- Known baseline failures: state/known-failures.yml.
