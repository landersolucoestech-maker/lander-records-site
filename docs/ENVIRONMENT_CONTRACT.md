# Environment contract

Valores reais nunca devem ser commitados nem impressos em logs públicos. Secrets de runtime pertencem ao secret store da plataforma ou a arquivo protegido server-side.

## Application runtime

| Variable | Class | Timing | Requirement / purpose |
|---|---|---|---|
| `NODE_ENV` | server-only | runtime | Required; literal `production` |
| `DATABASE_URL` | secret, server-only | runtime | Required; PostgreSQL URL, TLS/private routing required for remote DB |
| `NEXT_PUBLIC_SITE_URL` | public | build + runtime | Required canonical HTTPS origin; intentionally browser-visible |
| `CONTACT_IP_HASH_SALT` | secret, server-only | runtime | Required for contact abuse/privacy hashing; long independent random value |
| `SUPABASE_URL` | server-only endpoint | runtime | Required for Supabase media storage |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server-only | runtime | Required for media operations; never `NEXT_PUBLIC_*` |
| `SUPABASE_STORAGE_BUCKET` | server-only config | runtime | Optional; defaults to `media` |
| `INTEGRATION_TOKEN_ENCRYPTION_KEY` | secret, server-only | runtime | Required before storing OAuth tokens; 32 random bytes encoded as base64 |
| `SPOTIFY_CLIENT_ID` | server config | runtime | Required only to enable Spotify |
| `SPOTIFY_CLIENT_SECRET` | secret, server-only | runtime | Required only to enable Spotify |
| `SPOTIFY_REDIRECT_URI` | public endpoint | runtime | Required with Spotify; exact HTTPS callback registered at provider |
| `SOUNDCHARTS_CLIENT_ID` | server config | runtime | Required only to enable Soundcharts |
| `SOUNDCHARTS_CLIENT_SECRET` | secret, server-only | runtime | Required only to enable Soundcharts |
| `SOUNDCHARTS_TEAM_ID` | server-only config | runtime | Optional provider team scope |
| `CRON_SECRET` | secret, server-only | runtime | Required before enabling integration cron bearer authentication |
| `LANDER_SAAS_WEBHOOK_URL` | server-only endpoint | runtime | Optional; leave unset until the real service exists |
| `LANDER_SAAS_WEBHOOK_SECRET` | secret, server-only | runtime | Required together with webhook URL |

One-time bootstrap variables (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME`) must be injected only for the explicitly approved bootstrap command and removed afterward. They are not normal service environment.

## Release-only variables

`RELEASE_EVIDENCE_HMAC_KEY`, `PITR_EVIDENCE`, `PGSERVICE`, `PGSERVICEFILE`, `RESTORE_PGHOST`, `RESTORE_PGPORT`, `RESTORE_PGDATABASE`, `RESTORE_PGUSER`, `RESTORE_PGPASSWORD`, `BACKUP_DIR`, `DEPLOY_COMMIT`, `CHANGE_TICKET` and transient manifest paths are release tooling inputs. Store them in protected release configuration, separate restore credentials from production credentials, and never expose them to the browser. `MIGRATION_RELEASE_GUARD` is set only by the verified release wrapper; operators must not set it manually.

`SITE_URL` is a smoke-tool input. `TEST_DATABASE_URL`, `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_ERROR_BASE_URL` are test-only and forbidden in production runtime.

## Deployment credentials

Credentials used by a future deployment pipeline are platform-specific and must not be hard-coded into this contract. Keep them in a protected production Environment/secret store and scope them by least privilege.

A production pipeline must validate required credential presence without printing values and must remain fail-closed if approval, target SHA, environment identity or rollback evidence are absent.

## Boundary guarantees

Before first production deployment, validate:

- `DATABASE_URL` is server-only and targets the intended PostgreSQL instance;
- `SUPABASE_SERVICE_ROLE_KEY` exists only on the server and cannot reach client bundles;
- `NEXT_PUBLIC_SITE_URL` matches the canonical HTTPS origin;
- OAuth callback URLs match provider configuration exactly;
- no bootstrap, test or restore-only variable is present in the long-running production service;
- logs redact authorization headers, cookies and provider tokens.
