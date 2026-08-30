# Environment contract

Real values must never be committed or pasted into public logs. Runtime secrets belong in `/var/www/lander-records/shared/.env.production` (`0600`) or a provider secret store. GitHub deployment credentials belong in the `Production` Environment.

## Application runtime

| Variable | Class | Timing | Requirement / purpose |
|---|---|---|---|
| `NODE_ENV` | server-only | runtime | Required; literal `production` |
| `DATABASE_URL` | secret, server-only | runtime | Required; PostgreSQL URL, TLS/private routing required for remote DB |
| `NEXT_PUBLIC_SITE_URL` | public | build + runtime | Required canonical HTTPS origin; intentionally browser-visible |
| `CONTACT_IP_HASH_SALT` | secret, server-only | runtime | Required for contact abuse/privacy hashing; long independent random value |
| `SUPABASE_URL` | server-only endpoint | runtime | Required only when Supabase media storage is enabled |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server-only | runtime | Required for Supabase media operations; never `NEXT_PUBLIC_*` |
| `SUPABASE_STORAGE_BUCKET` | server-only config | runtime | Optional; defaults to `media` |
| `INTEGRATION_TOKEN_ENCRYPTION_KEY` | secret, server-only | runtime | Required before storing OAuth tokens; 32 random bytes encoded as base64 |
| `SPOTIFY_CLIENT_ID` | secret-like server config | runtime | Required only to enable Spotify |
| `SPOTIFY_CLIENT_SECRET` | secret, server-only | runtime | Required only to enable Spotify |
| `SPOTIFY_REDIRECT_URI` | public endpoint | runtime | Required with Spotify; exact HTTPS callback registered at provider |
| `SOUNDCHARTS_CLIENT_ID` | secret-like server config | runtime | Required only to enable Soundcharts |
| `SOUNDCHARTS_CLIENT_SECRET` | secret, server-only | runtime | Required only to enable Soundcharts |
| `SOUNDCHARTS_TEAM_ID` | server-only config | runtime | Optional provider team scope |
| `CRON_SECRET` | secret, server-only | runtime | Required before enabling integration cron bearer authentication |
| `LANDER_SAAS_WEBHOOK_URL` | server-only endpoint | runtime | Optional; leave unset until the real service exists |
| `LANDER_SAAS_WEBHOOK_SECRET` | secret, server-only | runtime | Required together with webhook URL |

One-time bootstrap variables (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME`) must be injected only for the explicitly approved bootstrap command and removed afterward. They are not normal service environment.

## Release-only host variables

`RELEASE_EVIDENCE_HMAC_KEY`, `PITR_EVIDENCE`, `PGSERVICE`, `PGSERVICEFILE`, `RESTORE_PGHOST`, `RESTORE_PGPORT`, `RESTORE_PGDATABASE`, `RESTORE_PGUSER`, `RESTORE_PGPASSWORD`, `BACKUP_DIR`, `DEPLOY_COMMIT`, `CHANGE_TICKET` and transient manifest paths are release tooling inputs. Store them in protected release configuration, separate restore credentials from production credentials, and never expose them to the browser. `MIGRATION_RELEASE_GUARD` is set only by the verified release wrapper; operators must not set it manually.

`SITE_URL` is a smoke-tool input. `TEST_DATABASE_URL`, `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_ERROR_BASE_URL` are test-only and forbidden in the production service file.

## GitHub-only deployment metadata

| Name | Scope | Kind |
|---|---|---|
| `IONOS_HOST` | Production Environment | secret |
| `IONOS_USER` | Production Environment | secret |
| `IONOS_SSH_KEY` | Production Environment | secret |
| `IONOS_HOST_FINGERPRINT` | Production Environment | secret |
| `IONOS_SSH_PORT` | Production Environment | variable |
| `PRODUCTION_DEPLOY_ENABLED` | Production Environment | variable, absent/false until explicit authorization |

Before first deployment, validate presence without printing values, file permissions, canonical URL consistency, OAuth callback equality and that no server-only name is emitted in client bundles.
