# Supabase Storage — contract (as implemented)

| Stage | Implementation |
|---|---|
| Config | SUPABASE_URL; SUPABASE_SERVICE_ROLE_KEY; SUPABASE_STORAGE_BUCKET (default media) |
| Credentials | service role key — server only, never NEXT_PUBLIC |
| Authentication | service role |
| Client | lib/storage/index.ts uploadMedia/deleteMedia (dynamic import) |
| Requests | upload object (webp normalized by sharp)<br>delete object |
| Raw response | SDK result; public URL stored in media_assets |
| Normalization | uploads re-encoded to webp ≤2400px, 12 MB input max |
| Identity | storage key ↔ media_assets row |
| Persistence | media_assets |
| Consumers | all public images, media kit, admin media library |
| Fallback | none — upload errors surface to the admin action |
| Error handling | thrown to server action (PT-BR message) |
| Retry | none (user retries) |
| Rate limit | provider-managed |
| Timeout | SDK default |
| Observability | admin action errors; broken image checks in public-routes spec |
