# IONOS deployment runbook

This is a preparation runbook. Every command that changes production remains blocked until a separately approved deployment change.

## Readiness stop conditions

Stop if the IONOS product/host inventory is incomplete; GitHub `Production` lacks approval protection; host fingerprint is unverified; a secret is missing; the target SHA is not approved; CI is not green; PITR evidence is absent/stale; backup or restore rehearsal fails; schema audit differs; TLS/domain are unresolved; or rollback cannot be demonstrated.

## Provisioning design

For a confirmed Linux server, create dedicated user `landerrecords`, directories `releases`, `shared`, `shared/release-evidence`, logs and restricted backups. Install Node 24 LTS, PostgreSQL client matching the provider, systemd and the already-selected reverse proxy. Never run the app as root or use mode `777`.

The systemd unit runs `/var/www/lander-records/current/server.js` with `HOSTNAME=127.0.0.1`, `PORT=3000`, the protected environment file, restart-on-failure and hardening compatible with required writable paths. Nginx terminates HTTPS, redirects HTTP once, preserves `Host`, `X-Forwarded-For` and `X-Forwarded-Proto`, and proxies only to loopback. Validate any existing Apache/Caddy configuration before installing another proxy.

## Atomic application sequence

1. Approve an exact full SHA already validated by CI and allowed by production policy.
2. Build from `npm ci` using Node 24; package `.next/standalone`, `.next/static`, `public` and release metadata.
3. Transfer into a new immutable `releases/<sha>` directory; verify artifact checksum and ownership.
4. Run the application candidate on a temporary loopback port with production configuration but no public switch; health check it.
5. Complete the independent database gate below only when the approved release needs migrations.
6. Atomically switch `current` symlink, restart only `lander-records.service`, wait/retry `/api/health`, and run `npm run smoke` against the public HTTPS origin.
7. On application-only failure, switch `current` back to the recorded previous release and restart. Never use `git pull` or mutate the active release.

The current workflow contains no SSH, migration, restart or deployment command. It remains fail-closed behind `PRODUCTION_DEPLOY_ENABLED` and deliberately fails if enabled. Replace that blocking job only after server inventory and an atomic transfer implementation are verified on that server. Before any host-side build, verify `node --version` is major 24 and `npm --version` is recorded.

## Database gate

Follow `docs/runbooks/DB_0010_RELEASE.md`: fresh provider PITR evidence bound to the exact target and ticket, signed precheck, exact custom-format dump, checksum/HMAC manifest, restore into an empty local `*_restore` database, audit, migration rehearsal, explicit production-write authorization, apply, post-audit. Migration `0010` remains blocked. Never perform a destructive down migration or overwrite production during restore rehearsal.

## Post-switch checks

- `/`, `/artistas/`, `/noticias/`, `/contato/`, `/api/health` return healthy responses;
- `/admin/` as visitor returns 307, 401 or 403 without following redirects;
- no secret, SQL or token appears in response/log excerpts;
- Nginx access/error log and `journalctl -u lander-records` show no new fatal errors;
- record SHA, release path, previous SHA, artifact checksum, migration/evidence IDs and operator approval.

## Observability

Application: systemd journal. Proxy: its access/error logs with retention. Deploy/migration/backup: protected timestamped evidence directory. Monitor `/api/health` from inside and outside the host, alert on sustained non-200/503, restart loops, disk pressure, certificate expiry and backup/rehearsal failures. Logs must redact URLs containing credentials, authorization headers, cookies and integration tokens.
