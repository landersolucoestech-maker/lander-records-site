# SoundCloud — contract (as implemented)

| Stage | Implementation |
|---|---|
| Config | artist_links rows (platform='soundcloud', active=true) edited in /admin/artists |
| Credentials | none for this provider directly; metrics require Soundcharts credentials |
| Authentication | n/a (public URLs); Soundcharts OAuth for metrics |
| Client | none — URL handling in lib/integrations/identity.ts (normalizeExternalUrl, normalizePlatformUrl, platformFromUrl) |
| Requests | Soundcharts GET /api/v2/search/external/url?platformUrl=<normalized soundcloud.com URL> (identity)<br>Soundcharts GET /api/v2/artist/{uuid}/audience/soundcloud?limit=1&sort=desc (metric) |
| Raw response | Soundcharts payload; the site extracts followerCount + date via latestNumericMetric |
| Normalization | host alias (www./m. → soundcloud.com), https, strip utm_*/si/feature params, trailing slash, fragment; platform host allowlist soundcloud.com |
| Identity | The SoundCloud URL is an identifier input, never an identity by itself; it proves a Soundcharts UUID only when /api/v2/artist/{uuid}/identifiers lists the same normalized URL. |
| Persistence | artist_metrics (platform='soundcloud', source='soundcharts'); artist_metric_history; integration_metric_cache (entity artist|lander_records) |
| Consumers | app/(public)/artistas/[slug]/page.tsx (metrics > 0 rendered with PT-BR labels); app/admin/(protected)/artists (read-only metric fields) |
| Fallback | same-identity provider failure keeps last known value; identity cleared/changed purges values (F-0003) |
| Error handling | Soundcharts errors persisted in artist_external_identities.last_error / soundcharts_last_error |
| Retry | no in-request retry; next cron run (every 6h, Soundcharts TTL 24h) |
| Rate limit | Soundcharts 429 surfaced as error with Retry-After |
| Timeout | 10s (AbortSignal.timeout) on Soundcharts requests |
| Observability | persisted last_error + last_synced_at; sensors metric-freshness, identity-conflicts |
