# Deployment / Cutover

## Required runtime

GitHub Pages is not a valid production runtime for this branch because the application now requires server execution.

Required capabilities:

- Node-compatible Next.js runtime;
- PostgreSQL connection (`DATABASE_URL`);
- HTTPS;
- object storage token for media;
- environment secrets;
- ability to run the migration once before serving traffic.

## Recommended target

A Next.js-native deployment platform with managed PostgreSQL and object storage is the simplest operational fit. The application does not depend on Supabase.

## Required environment variables

See `.env.example`.

Mandatory before public traffic:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CONTACT_IP_HASH_SALT`

Mandatory before admin media upload:

- `BLOB_READ_WRITE_TOKEN`

Optional until the Lander SaaS endpoint exists:

- `LANDER_SAAS_WEBHOOK_URL`
- `LANDER_SAAS_WEBHOOK_SECRET`

## Cutover sequence

1. provision dynamic Next.js project;
2. provision PostgreSQL;
3. set runtime variables;
4. run `npm run db:migrate`;
5. create first owner with `npm run admin:bootstrap`;
6. provision object storage and set its token;
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
