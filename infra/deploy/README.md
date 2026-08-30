# IONOS runtime deployment

This project is prepared for a conventional Node.js server, not a static export.

1. Build with `npm ci`, `npm run db:migrate`, and `npm run build`.
2. Copy `.next/standalone` and `.next/static` into the release directory.
3. Copy `public` into the release directory so static assets remain available.
4. Run the generated standalone `server.js` with the production environment file.
5. Put Nginx in front of port `3000` using the example in `infra/nginx`.

The production environment must include `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET=media`.