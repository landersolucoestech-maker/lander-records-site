# YouTube — auditor checklist

1. Configuration documented in .env.example / docs (artist_links rows (platform='youtube', active=true) edited in /admin/artists, lander_records_integration_settings.youtube_url edited in /admin/settings/lander-records)
2. Credential handling server-only; encrypted at rest where persisted
3. Client behavior: none — URL handling in lib/integrations/identity.ts (normalizeExternalUrl, normalizePlatformUrl, platformFromUrl)
4. Timeout present (10s (AbortSignal.timeout) on Soundcharts requests); redirect policy safe
5. Retry semantics: no in-request retry; next cron run (every 6h, Soundcharts TTL 24h); permanent failures not retried
6. Normalization: host alias (www./m. → youtube.com / youtu.be), https, strip utm_*/si/feature params, trailing slash, fragment; platform host allowlist youtube.com / youtu.be
7. Identity: The YouTube URL is an identifier input, never an identity by itself; it proves a Soundcharts UUID only when /api/v2/artist/{uuid}/identifiers lists the same normalized URL.
8. Persistence consistent: artist_metrics (platform='youtube', source='soundcharts'); artist_metric_history; integration_metric_cache (entity artist|lander_records)
9. Consumers render truthfully: app/(public)/artistas/[slug]/page.tsx (metrics > 0 rendered with PT-BR labels); app/(public)/page.tsx social cards (value or '—'); app/admin/(protected)/artists (read-only metric fields)
10. Fallback does not mask errors: same-identity provider failure keeps last known value; identity cleared/changed purges values (F-0003)
11. Observability: persisted last_error + last_synced_at; sensors metric-freshness, identity-conflicts

Output: findings (domain integrations or identity) + update of state/integrations.yml dimensions with evidence ids.
