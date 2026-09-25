# Soundcharts — auditor checklist

1. Configuration documented in .env.example / docs (SOUNDCHARTS_CLIENT_ID, SOUNDCHARTS_CLIENT_SECRET, SOUNDCHARTS_TEAM_ID (optional), artist platform links + Lander Instagram/YouTube URLs)
2. Credential handling server-only; encrypted at rest where persisted
3. Client behavior: lib/integrations/soundcharts.ts: getAccessToken, soundchartsRequest (10s timeout, redirect:error, 401 retry once, 429 → error with Retry-After, 404 → null)
4. Timeout present (10s per request (F-0004)); redirect policy safe
5. Retry semantics: cron-driven; no exponential backoff inside a run (single attempt per request, token refresh once); permanent failures not retried
6. Normalization: values rounded to integers ≥ 0; observedAt from date/timestamp keys or null (unknown), never now()
7. Identity: UUID accepted only if UUID_PATTERN matches AND identifiers endpoint lists the exact normalized source URL (403 on identifiers = not verified). Priority: Spotify artist ID → YouTube → Instagram → TikTok → SoundCloud → Spotify URL.
8. Persistence consistent: artist_external_identities (uuid, resolution_status unresolved|resolved|needs_review|error, matched_via_*); lander_records_integration_settings.soundcharts_*; artist_metrics / artist_metric_history / integration_metric_cache
9. Consumers render truthfully: public artist page metrics; home social cards (instagram:followers, youtube:subscribers); /admin/settings/lander-records status; artist admin read-only metrics
10. Fallback does not mask errors: fetchSoundchartsArtistMetrics uses Promise.allSettled: partial results kept; all failed → throw; same identity keeps last values; identity change purges
11. Observability: *_last_error, *_last_synced_at, last_resolved_at; sensors metric-freshness and identity-conflicts

Output: findings (domain integrations or identity) + update of state/integrations.yml dimensions with evidence ids.
