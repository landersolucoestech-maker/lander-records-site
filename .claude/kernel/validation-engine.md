# Validation engine

Order: targeted test → `npm test` → `npm run typecheck` → `npm run test:integration` (local *_test DB) → `npm run build` → browser spec when UI/HTTP behavior changed → gates for the domain. Each run via `evidence.mjs run`. Failures compared with state/known-failures.yml; a new failure caused by the change re-enters FIXING (self-healing). Build green is never sufficient alone.
