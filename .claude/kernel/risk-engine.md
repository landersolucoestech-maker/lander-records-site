# Risk engine

Impact levels: L0 docs · L1 isolated · L2 module behavior · L3 cross-module/integration · L4 architecture/public contract/dependency · L5 security, data/migration, infra, production.
Lander-specific L5 surfaces: lib/auth/**, proxy.ts, lib/contact-client-ip.ts, lib/integrations/secrets.ts, migrations/**, scripts/migrate.mjs, scripts/release/**, app/api/cron/**, CRON/SAAS/OAuth secret handling, infra/**.
Impact is a floor: a one-line change in an L5 surface is L5.
