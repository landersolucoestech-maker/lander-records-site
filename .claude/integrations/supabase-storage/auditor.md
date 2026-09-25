# Supabase Storage — auditor checklist

1. Configuration documented in .env.example / docs (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET (default media))
2. Credential handling server-only; encrypted at rest where persisted
3. Client behavior: lib/storage/index.ts uploadMedia/deleteMedia (dynamic import)
4. Timeout present (SDK default); redirect policy safe
5. Retry semantics: none (user retries); permanent failures not retried
6. Normalization: uploads re-encoded to webp ≤2400px, 12 MB input max
7. Identity: storage key ↔ media_assets row
8. Persistence consistent: media_assets
9. Consumers render truthfully: all public images, media kit, admin media library
10. Fallback does not mask errors: none — upload errors surface to the admin action
11. Observability: admin action errors; broken image checks in public-routes spec

Output: findings (domain integrations or identity) + update of state/integrations.yml dimensions with evidence ids.
