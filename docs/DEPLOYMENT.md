# Deployment / Cutover

## Required runtime

GitHub Pages is not a valid production runtime for this branch because the application now requires server execution.

Required capabilities:

- Node-compatible Next.js runtime;
- PostgreSQL connection (`DATABASE_URL`);
- HTTPS;
- Supabase Storage bucket `media` and server-only service-role credentials;
- environment secrets;
- ability to run the migration once before serving traffic.

## Recommended target

An IONOS Node.js runtime with PostgreSQL is the intended production fit. The application does not depend on Supabase or a platform-specific object storage service.

The manual deployment workflow is `.github/workflows/deploy-ionos.yml`. Configure `IONOS_HOST`, `IONOS_USER` and `IONOS_SSH_KEY` as GitHub Actions secrets before using it.

## Required environment variables

See `.env.example`.

Mandatory before public traffic:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CONTACT_IP_HASH_SALT`

Mandatory before admin media upload:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=media`

Optional until the Lander SaaS endpoint exists:

- `LANDER_SAAS_WEBHOOK_URL`
- `LANDER_SAAS_WEBHOOK_SECRET`

## Cutover sequence

1. provision dynamic Next.js project;
2. provision PostgreSQL;
3. set runtime variables;
4. run `npm run db:migrate`;
5. create first owner with `npm run admin:bootstrap`;
6. create or validate the Supabase Storage bucket `media`;
7. deploy this branch to a preview;
8. validate public routes and `/admin`;
9. validate artist/category/post CRUD and publication;
10. validate one real media upload;
11. validate one real contact submission;
12. attach production domain;
13. only then replace the legacy GitHub Pages deployment.

The old GitHub Pages site should remain untouched until step 12 succeeds.

## SaaS webhook cutover

Do not set webhook variables to a dummy URL. Once the SaaS endpoint exists:

1. configure its URL and shared secret;
2. send one contact;
3. verify HMAC and idempotency on the SaaS side;
4. confirm the outbox event changes to `delivered`;
5. retry any prior `disabled`/`failed` events from the admin contact module.
