# Rollback and database recovery

Rollback authority is separate from deployment authority. Record `current` and previous full SHAs before any switch.

## Application rollback

Use only when the database remains compatible and data invariants are intact:

1. stop further releases and preserve logs/evidence;
2. verify the previous immutable release and its checksum;
3. atomically repoint `current` to `releases/<previous-sha>`;
4. restart only `lander-records.service`;
5. wait for `/api/health`, then run all public and admin fail-closed smokes;
6. document incident, old/new SHA, timestamps and outcome.

Do not rebuild the previous release in place and do not use `git reset` on the active tree.

## Database recovery

Application rollback does not undo a schema/data migration. Migration `0010` is forward-only. If a transaction fails, preserve the database and audit before acting. If a committed change damages data or availability:

- stop traffic-changing work;
- choose fix-forward only when the defect is understood and invariants remain intact;
- prove recovery by restoring the signed exact dump into an isolated database;
- prefer provider PITR to a **new instance** at an approved timestamp for production recovery;
- compare identity, schema, migrations, row invariants and storage/metric provenance before any cutover.

Never restore over the production database, delete the failed instance or alter migration history without a separately approved recovery plan. Required evidence includes provider PITR retention/window, backup checksum/signature, target identity, application SHA, change ticket and restore rehearsal result.
