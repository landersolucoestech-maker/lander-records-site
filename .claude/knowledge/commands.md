# Commands

- **lint**: `npm run lint`
- **typecheck**: `npm run typecheck`
- **unit**: `npm test`
- **integration**: `npm run test:integration (requires DATABASE_URL to a local *_test database)`
- **migrate**: `npm run db:migrate (local only by design)`
- **build**: `npm run build`
- **smoke**: `npm run smoke`
- **browser**: `npm run test:browser (PLAYWRIGHT_BASE_URL; contact spec needs E2E_CONTACT_SUBMIT=1)`
- **schemaAudit**: `node scripts/audit-db.mjs (DATABASE_URL)`
- **schemaCapture**: `TEST_DATABASE_URL=...*_test node scripts/capture-db-schema-contract.mjs`
- **migrationPath**: `TEST_DATABASE_URL=...*_test node tests/database/migration-path.integration.mjs`
- **legacyOrigin**: `node scripts/check-legacy-origin.mjs`
- **claudeOs**: `npm run os:validate && npm run test:claude-os`

## OS runtime
- `node .claude/runtime/preflight.mjs` · `controller.mjs next|status` · `findings.mjs list|ready|show|transition|index|validate` · `mission.mjs start|requirement|criterion|status|close` · `evidence.mjs run|review|list|fresh` · `gate.mjs <id> [--record]` · `sensors.mjs run [--only] [--emit-findings]` · `graph.mjs build|check` · `pack.mjs` · `completion.mjs`
