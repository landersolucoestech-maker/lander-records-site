#!/usr/bin/env sh
set -eu
: "${RESTORE_PGHOST:?RESTORE_PGHOST is required}"
: "${RESTORE_PGPORT:?RESTORE_PGPORT is required}"
: "${RESTORE_PGDATABASE:?RESTORE_PGDATABASE is required}"
: "${RESTORE_PGUSER:?RESTORE_PGUSER is required}"
: "${RESTORE_PGPASSWORD:?RESTORE_PGPASSWORD is required}"
: "${RELEASE_EVIDENCE_HMAC_KEY:?RELEASE_EVIDENCE_HMAC_KEY is required}"
: "${CHANGE_TICKET:?CHANGE_TICKET is required}"
: "${DEPLOY_COMMIT:?DEPLOY_COMMIT is required}"
DUMP="${1:?exact dump path is required}"; OUTPUT="${2:?evidence output path is required}"
PGHOST="$RESTORE_PGHOST"; PGPORT="$RESTORE_PGPORT"; PGDATABASE="$RESTORE_PGDATABASE"; PGUSER="$RESTORE_PGUSER"; PGPASSWORD="$RESTORE_PGPASSWORD"
export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD
test -r "$DUMP"; pg_restore --list "$DUMP" >/dev/null
IDENTITY="$(psql -Atqc "select current_database() || '|' || coalesce(inet_server_addr()::text,'local') || '|' || inet_server_port()::text || '|' || current_user")"
RESTORE_DB="${IDENTITY%%|*}"; RESTORE_HOST="${IDENTITY#*|}"
RESTORE_HOST="${RESTORE_HOST%%|*}"
case "$RESTORE_DB" in *_test|*_restore) ;; *) echo "Restore database must end in _test or _restore" >&2; exit 1 ;; esac
case "$RESTORE_HOST" in 127.0.0.1|::1|local) ;; *) echo "Restore rehearsal must target local PostgreSQL" >&2; exit 1 ;; esac
TABLES="$(psql -Atqc "select count(*) from pg_tables where schemaname='public'")"; test "$TABLES" = "0"
env -u DATABASE_URL pg_restore --exit-on-error --no-owner --no-privileges "$DUMP"
DATABASE_URL="$(node scripts/release/postgres-url-from-env.mjs)"; export DATABASE_URL
NODE_IDENTITY="$(node scripts/release/database-identity.mjs)"
test "$NODE_IDENTITY" = "$IDENTITY"
node scripts/migrate.mjs
node scripts/audit-db.mjs
DUMP_SHA="$(sha256sum "$DUMP" | awk '{print $1}')"
node scripts/release/create-rehearsal-evidence.mjs --dump-sha256="$DUMP_SHA" --commit="$DEPLOY_COMMIT" --change-ticket="$CHANGE_TICKET" --restore-database="$RESTORE_DB" --output="$OUTPUT"
printf 'REHEARSAL_EVIDENCE=%s\n' "$OUTPUT"
