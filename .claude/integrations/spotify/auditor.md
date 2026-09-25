# Spotify — auditor checklist

1. Configuration documented in .env.example / docs (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI (must be https or loopback and path /api/integrations/spotify/callback), INTEGRATION_TOKEN_ENCRYPTION_KEY, playlist URL in /admin/settings/lander-records)
2. Credential handling server-only; encrypted at rest where persisted
3. Client behavior: spotifyApi: host/path/param allowlist (resolveSpotifyApiUrl), 10s timeout, redirect:error, one short 429 retry (Retry-After ≤ 3s)
4. Timeout present (10s); redirect policy safe
5. Retry semantics: cron every 6h + on-demand refresh from home when due; permanent failures not retried
6. Normalization: dedupe by track id; sort by release date (precision-aware) then added_at then id; keep 5; only https open.spotify.com track/album URLs
7. Identity: spotify_playlist_id derived from URL (spotifyPlaylistIdFromUrl); spotify_user_id from /me. Spotify artist IDs (from artist links) are a Soundcharts resolution input only.
8. Persistence consistent: spotify_release_cache positions 1..5 (replaced in one transaction); lander_records_integration_settings.spotify_*; spotify_oauth_states
9. Consumers render truthfully: app/(public)/page.tsx release cards via getHomeSpotifyReleaseFeed
10. Fallback does not mask errors: cache valid 6h; stale cache served up to 7 days; home triggers refresh when due with 5 min cooldown after an error
11. Observability: spotify_last_synced_at / spotify_last_error; tests/spotify-security.test.cjs

Output: findings (domain integrations or identity) + update of state/integrations.yml dimensions with evidence ids.
