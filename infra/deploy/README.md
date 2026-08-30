# IONOS runtime deployment

This project is prepared for a conventional Node.js server, not a static export.

1. Build an immutable artifact with Node 24, `npm ci`, and `npm run build`.
2. Copy `.next/standalone` and `.next/static` into the release directory.
3. Copy `public` into the release directory so static assets remain available.
4. Run the generated standalone `server.js` with the production environment file.
5. Put the already-selected reverse proxy in front of loopback port `3000`.
6. Keep migrations behind the independent evidence gate in `docs/runbooks/DB_0010_RELEASE.md`; building an application release never implies migration authorization.

The complete contract is `docs/ENVIRONMENT_CONTRACT.md`. The real IONOS product
must be inventoried before installing these examples.
