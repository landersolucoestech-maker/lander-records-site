# Retry controller (as implemented)

| Provider | In-request retry | Cross-run retry | Backoff |
|---|---|---|---|
| Soundcharts | token refresh once on 401 | next cron (6h), Soundcharts TTL 24h | none within run |
| Spotify | one retry if 429 Retry-After ≤ 3s | cron 6h; home refresh with 5 min cooldown after error | fixed |
| Lead webhook | none | `retryDueOutboxEvents` each cron | exponential 15 min ×2 cap 24h, 8 attempts, then dead_letter (ADR-0004) |
| Supabase Storage | none | user retry | — |

Rules: retries must be idempotent (outbox event id stable; sync upserts), bounded, and must never retry permanent failures (4xx except 401/403/408/425/429).
