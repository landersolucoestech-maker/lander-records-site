# Spotify — workflow

1. **Audit** — run auditor.md; `node .claude/runtime/sensors.mjs run --only metric-freshness,identity-conflicts,lead-delivery,provider-timeouts` (DB sensors need DATABASE_URL).
2. **Trace** — follow contract.md stage by stage in code; note the first stage where reality diverges.
3. **Root cause** — confirm with a failing test (unit for pure mapping, tests/integration with provider HTTP doubled for persistence semantics).
4. **Correct** — fix in the owning stage only (client for parsing, sync for persistence semantics, page for rendering).
5. **Validate** — targeted test red→green, npm test, npm run test:integration, typecheck, build.
6. **Review** — integration-reviewer + adversarial-reviewer.
7. **Reaudit** — rerun step 1; update state/integrations.yml with evidence ids.
Recovery: `workflows/provider-recovery.yml`; drift: `workflows/provider-drift.yml`.
