# Soundcharts — contract (as implemented)

| Stage | Implementation |
|---|---|
| Config | SOUNDCHARTS_CLIENT_ID; SOUNDCHARTS_CLIENT_SECRET; SOUNDCHARTS_TEAM_ID (optional); artist platform links + Lander Instagram/YouTube URLs |
| Credentials | OAuth client credentials (Basic auth to account.soundcharts.com/oauth/token); access token cached in process memory, refreshed 60s before expiry; forced refresh once on 401 |
| Authentication | OAuth2 client_credentials; Bearer on customer.api.soundcharts.com |
| Client | lib/integrations/soundcharts.ts: getAccessToken, soundchartsRequest (10s timeout, redirect:error, 401 retry once, 429 → error with Retry-After, 404 → null) |
| Requests | GET /api/v2.9/artist/by-platform/spotify/{spotifyArtistId}<br>GET /api/v2/search/external/url?platformUrl=<br>GET /api/v2/artist/{uuid}/identifiers?limit=100 (verification)<br>GET /api/v2/artist/{uuid}/audience/{instagram|youtube|tiktok|soundcloud}?limit=1&sort=desc<br>GET /api/v2/artist/{uuid}/streaming/spotify/listening?limit=1&sort=desc<br>GET /api/v2/team/usage |
| Raw response | JSON walked defensively: extractSoundchartsUuid (uuid keys first), containsArtistType, latestNumericMetric (followerCount / listeners variants, newest date wins) |
| Normalization | values rounded to integers ≥ 0; observedAt from date/timestamp keys or null (unknown), never now() |
| Identity | UUID accepted only if UUID_PATTERN matches AND identifiers endpoint lists the exact normalized source URL (403 on identifiers = not verified). Priority: Spotify artist ID → YouTube → Instagram → TikTok → SoundCloud → Spotify URL. |
| Persistence | artist_external_identities (uuid, resolution_status unresolved|resolved|needs_review|error, matched_via_*); lander_records_integration_settings.soundcharts_*; artist_metrics / artist_metric_history / integration_metric_cache |
| Consumers | public artist page metrics; home social cards (instagram:followers, youtube:subscribers); /admin/settings/lander-records status; artist admin read-only metrics |
| Fallback | fetchSoundchartsArtistMetrics uses Promise.allSettled: partial results kept; all failed → throw; same identity keeps last values; identity change purges |
| Error handling | messages persisted (PT-BR) to last_error; syncAllIntegrations isolates per-artist errors |
| Retry | cron-driven; no exponential backoff inside a run (single attempt per request, token refresh once) |
| Rate limit | 429 → error including Retry-After; next cron run retries |
| Timeout | 10s per request (F-0004) |
| Observability | *_last_error, *_last_synced_at, last_resolved_at; sensors metric-freshness and identity-conflicts |
