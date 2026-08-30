# Database release 0010

This is a forward-only production procedure for `0010_preserve_integration_history.sql` and the approved checksum transitions for `0002`, `0007`, and `0008`. It does not authorize a production write.

## Stop conditions

Stop before migration if any of these is true:

- the provider cannot confirm PITR is enabled and its retention covers the release window;
- a fresh, restorable backup cannot be produced;
- the precheck shows an unexpected database, user, migration checksum, metric count, or storage provider;
- the local rehearsal or schema audit fails;
- an operator has not explicitly approved the production write.

Do not attempt to repair historical data by guessing. If earlier migrations removed data, recover it from a backup/PITR copy into an isolated database and reconcile it separately.

## Rehearsal and read-only checks

1. Record the provider's PITR status in a protected JSON `PITR_EVIDENCE` file linked to the change ticket. It must contain `result: "PASS"`, `verifiedAt` (less than 24 hours old), `retention`, `earliestRestorePoint`, `latestRestorePoint`, `changeTicket`, and the exact `target` object (`host`, `port`, `serverAddress`, `serverPort`, `database`, `user`).
2. Configure `/etc/lander-records/release.env` (mode `0600`, deployment user readable) with `DATABASE_URL`, a 32+ character `RELEASE_EVIDENCE_HMAC_KEY`, `PITR_EVIDENCE`, `PGSERVICE`, `PGSERVICEFILE`, and one local restore connection expressed as `RESTORE_PGHOST`, `RESTORE_PGPORT`, `RESTORE_PGDATABASE`, `RESTORE_PGUSER`, `RESTORE_PGPASSWORD`. The rehearsal derives the Node URL from those same libpq values and proves both clients reached the same database identity before migration. Secrets never appear in `pg_dump` argv.
3. Run `node scripts/release/db-0010-release.mjs plan`. This opens no database connection.
4. The release workflow creates an HMAC-signed precheck manifest bound to exact host/port/database/user, commit, change ticket and PITR evidence hash.
5. The exact production dump is restored into an empty local database ending `_test` or `_restore`; its schema audit must pass. Signed rehearsal evidence is bound to the dump SHA-256, commit and ticket.
6. Post-audit compares the signed precheck to live counts. Total/non-Soundcharts metrics and every existing storage-provider count must not decrease.

Production precheck is read-only:

```sh
node scripts/release/db-0010-release.mjs precheck --commit="$DEPLOY_COMMIT" --change-ticket="$CHANGE_TICKET" --pitr-evidence="$PITR_EVIDENCE" --output="$PRECHECK_MANIFEST"
```

## Backup and apply

Create and validate a fresh custom-format backup. The script publishes a path only after `pg_restore --list` succeeds:

```sh
BACKUP_DIR=/var/backups/lander-records infra/backup/backup-db.sh
```

Keep the emitted `BACKUP_VERIFIED` path. After explicit production approval, the exact write command is:

```sh
node scripts/release/db-0010-release.mjs apply --allow-remote-write --confirm=APPLY_0010_AND_CHECKSUM_TRANSITIONS --commit="$DEPLOY_COMMIT" --change-ticket="$CHANGE_TICKET" --pitr-evidence="$PITR_EVIDENCE" --precheck="$PRECHECK_MANIFEST" --backup-manifest="$BACKUP_MANIFEST" --rehearsal-evidence="$REHEARSAL_EVIDENCE"
```

The wrapper refuses a non-local write unless all signed evidence agrees on target, commit, ticket, PITR evidence and exact dump hash, and unless that exact dump passed an isolated local restore rehearsal. Backup evidence older than one hour is rejected.

Then run:

```sh
node scripts/release/db-0010-release.mjs post-audit --precheck="$PRECHECK_MANIFEST" --output="$POST_AUDIT_MANIFEST"
```

Restart the application only if the audit passes. After restart, require HTTP 200 from `/` and require unauthenticated `/admin/` to return 307, 401 or 403. A smoke failure fails the deployment.

## Recovery decision

The migration is transactional. If it fails before commit, do not manually edit migration history; capture the error and audit current state. If it commits but post-audit or smoke tests fail, stop traffic-changing work and choose recovery with the database owner:

- fix forward only when data invariants remain intact and the defect is understood;
- restore the verified dump to an isolated database to validate recovery;
- use provider PITR to a new instance for production recovery when data was altered or availability is unsafe.

Never restore destructively over production without a separately approved recovery plan. Preserve the failed database and logs as evidence.
