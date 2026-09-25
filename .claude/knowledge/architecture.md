# Architecture (lander-records-site)

- **framework**: Next.js 16.3.3 App Router (output: standalone, trailingSlash: true, reactStrictMode)
- **language**: TypeScript 5 (strict tsc --noEmit), React 19
- **packageManager**: npm (package-lock.json); engines node >=24 <25 (.nvmrc)
- **database**: PostgreSQL via postgres.js + Drizzle ORM 0.45.2 (lib/db/*.ts)
- **migrations**: hand-written SQL in migrations/NNNN_*.sql applied by scripts/migrate.mjs with cms_schema_migrations checksums; remote targets refused unless MIGRATION_RELEASE_GUARD=VERIFIED_PITR_BACKUP_REHEARSAL
- **validation**: zod 3 (route payloads, server actions)
- **auth**: server-side admin sessions (cookie lander_admin_session, bcryptjs, lockout after 5 failures for 15 min), RBAC viewer<editor<admin<owner (lib/auth/policy.ts), proxy.ts boundary for /admin and /api/admin
- **storage**: Supabase Storage (server-only service role) via lib/storage; uploads normalized with sharp to webp <= 2400px, 12 MB max
- **cms**: in-app CMS under /admin (pages, sections, posts, artists, media, navigation, media kit, settings, users, audit)
- **seo**: lib/seo.ts buildMetadata/resolveCanonicalUrl/absolutePageUrl, app/sitemap.ts, app/robots.ts
- **testing**: node:test unit/auth/database suites, DB integration scripts (tests/integration/*.mjs), Playwright browser specs (tests/browser)
- **ci**: .github/workflows/cms-ci.yml: legacy-origin check, npm ci, db:migrate, npm test, test:integration, typecheck, build, runtime smoke

## Layers
`app/(public)` public pages (server components) · `app/admin` CMS (server components + client managers + server actions) · `app/api` route handlers · `app/cms-preview` disposable preview with mock data · `modules/*` domain facades (artists, contacts, integrations, media, pages, posts, settings) · `lib/*` services (auth, contact, integrations, storage, seo, security, logging, validation) · `lib/db` Drizzle schema (schema.ts, integration-schema.ts, artist/news/page management schemas) · `migrations/*.sql` · `scripts/*` migrate/seed/audit/release · `infra/*` nginx/systemd/backup examples.

## Boundaries
- Admin: `proxy.ts` redirects/401s without session cookie; every protected page/action calls `requireAdmin(role)`; RBAC viewer<editor<admin<owner.
- Public write surface: only `POST /api/contact/`.
- Scheduled: `GET /api/cron/integrations/` (Bearer CRON_SECRET) → provider sync + outbox retry.
- External providers: Soundcharts, Spotify, Supabase Storage, generic signed webhook (unset). Instagram/YouTube/TikTok/SoundCloud only as URLs, embeds and Soundcharts metrics.

## Routes
See `graphs/routes.json` (generated).
