#!/usr/bin/env sh
set -eu
: "${PGSERVICE:?PGSERVICE is required; do not pass DATABASE_URL to pg_dump}"
: "${PGSERVICEFILE:?PGSERVICEFILE must name a protected libpq service file}"
: "${RELEASE_EVIDENCE_HMAC_KEY:?RELEASE_EVIDENCE_HMAC_KEY is required}"
: "${PRECHECK_MANIFEST:?PRECHECK_MANIFEST is required}"
: "${PITR_EVIDENCE:?PITR_EVIDENCE is required}"
: "${CHANGE_TICKET:?CHANGE_TICKET is required}"
: "${DEPLOY_COMMIT:?DEPLOY_COMMIT is required}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lander-records}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; FINAL="$BACKUP_DIR/lander-records-$STAMP.dump"; PARTIAL="$FINAL.partial"; MANIFEST="$FINAL.manifest.json"
test -r "$PGSERVICEFILE"; test -r "$PRECHECK_MANIFEST"; test -r "$PITR_EVIDENCE"
mkdir -p "$BACKUP_DIR"; umask 077; trap 'rm -f "$PARTIAL"' EXIT HUP INT TERM
# Only the non-secret service name appears in argv. Credentials remain in the
# protected libpq service/pass file; DATABASE_URL is removed for pg_dump.
env -u DATABASE_URL pg_dump --dbname="service=$PGSERVICE" --format=custom --no-owner --no-privileges --file="$PARTIAL"
pg_restore --list "$PARTIAL" >/dev/null; mv "$PARTIAL" "$FINAL"; trap - EXIT HUP INT TERM
DUMP_SHA="$(sha256sum "$FINAL" | awk '{print $1}')"
BACKUP_TARGET="$(env -u DATABASE_URL psql "service=$PGSERVICE" -Atqc "select coalesce(inet_server_addr()::text,'local') || '|' || inet_server_port()::text || '|' || current_database() || '|' || current_user")"
node scripts/release/create-backup-manifest.mjs --dump="$FINAL" --dump-sha256="$DUMP_SHA" --backup-target="$BACKUP_TARGET" --precheck="$PRECHECK_MANIFEST" --pitr-evidence="$PITR_EVIDENCE" --change-ticket="$CHANGE_TICKET" --commit="$DEPLOY_COMMIT" --output="$MANIFEST"
printf 'BACKUP_VERIFIED=%s\nBACKUP_MANIFEST=%s\n' "$FINAL" "$MANIFEST"
