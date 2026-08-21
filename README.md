# Lander Records Site + CMS

Public website and operational backoffice for Lander Records.

## Architecture

This branch replaces the former GitHub Pages static-export content model with a dynamic Next.js application backed by PostgreSQL. Public content is read from the same source edited by `/admin`.

- Next.js App Router
- PostgreSQL
- Drizzle ORM
- Local persistent media storage under `public/uploads`
- Server-side admin sessions and RBAC
- Structured page sections instead of arbitrary page-builder JSON
- Durable contact submission + integration outbox
- Dynamic SEO, sitemap and structured data

## Local / CI database

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run admin:bootstrap
npm run dev
```

No default admin password exists in the repository.

## Deployment

The old GitHub Pages deployment is intentionally not modified by this feature branch. Production cutover requires a Node/Next-compatible runtime plus PostgreSQL and object storage. See `docs/CMS_ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.

## Important

Supabase is not part of this architecture or migration.
