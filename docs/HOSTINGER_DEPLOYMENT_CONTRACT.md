# Hostinger Deployment Contract

Hostinger is the only authorized production hosting target for this repository. This contract prepares deployment; it does not authorize a production write.

## Required capability
The selected Hostinger plan/runtime must support the application's dynamic Next.js standalone server on Node.js 24. Static-only publication is incompatible with this repository.

## Immutable release inputs
- exact Git SHA from `dev` explicitly approved by the user for production promotion;
- green CMS Foundation CI and Dev Preview for that SHA;
- reproducible `npm ci && npm run build`;
- runtime secrets supplied outside Git;
- PostgreSQL connectivity and migration gate;
- Supabase Storage connectivity;
- canonical HTTPS origin.

## Runtime
Build with Node.js 24. The application uses `output: "standalone"`. Preserve `.next/standalone`, `.next/static` and `public` in the release artifact. Start the generated standalone server with production environment variables. Do not use static export.

## Required environment
`NODE_ENV=production`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `CONTACT_IP_HASH_SALT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `INTEGRATION_TOKEN_ENCRYPTION_KEY`, and `CRON_SECRET`. Provider credentials are required only when their integrations are enabled.

## Promotion gate
1. Confirm exact SHA and explicit production approval.
2. Confirm CI and preview PASS for that SHA.
3. Confirm Hostinger runtime inventory and Node.js 24 compatibility.
4. Confirm secrets without printing values.
5. Confirm PostgreSQL backup/PITR/restore evidence before any required migration.
6. Build immutable candidate.
7. Start candidate without switching traffic where the Hostinger product permits it.
8. Verify `/api/health/` and runtime logs.
9. Promote traffic/domain.
10. Run `npm run smoke` against the canonical HTTPS origin.
11. Record active SHA, previous SHA, timestamp, migration state and evidence.

## Rollback
Keep the previous application release addressable. Application rollback restores the previous immutable artifact. Never perform a destructive down migration as an automatic rollback. Database recovery follows `docs/runbooks/DB_0010_RELEASE.md`.

## Scheduler
If Hostinger cron is used for integration synchronization, call `/api/cron/integrations/` with `Authorization: Bearer <CRON_SECRET>`. Never place the secret in a URL/query string or repository file.

## Forbidden
Vercel deployment/integration; automatic production deploy from a branch push; production `git pull`; committed secrets; static export; bypassing database approval; modifying `main` without a new explicit user order.
