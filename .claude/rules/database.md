# database rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Schema changes = new migrations/NNNN_name.sql wrapped in BEGIN/COMMIT + Drizzle definition + re-captured scripts/db-schema-contract.json.
- Never modify an applied migration (checksums; approved transitions only via migrations/legacy-checksums.json).
- `ALTER TYPE ... ADD VALUE` must not be used by the same transaction.
- Remote migrate refused unless MIGRATION_RELEASE_GUARD=VERIFIED_PITR_BACKUP_REHEARSAL (scripts/migrate.mjs).
- Integration tests run only against local *_test databases.
- NULL means unknown; '' only where the column contract says empty-string default.
