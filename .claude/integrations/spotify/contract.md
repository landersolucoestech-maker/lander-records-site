# Spotify — contract (as implemented)

| Stage | Implementation |
|---|---|
| Config | SPOTIFY_CLIENT_ID; SPOTIFY_CLIENT_SECRET; SPOTIFY_REDIRECT_URI (must be https or loopback and path /api/integrations/spotify/callback); INTEGRATION_TOKEN_ENCRYPTION_KEY; playlist URL in /admin/settings/lander-records |
| Credentials | refresh token encrypted AES-256-GCM (v1:iv:tag:data) in lander_records_integration_settings.spotify_refresh_token_encrypted; rotated when Spotify returns a new one |
| Authentication | OAuth2 Authorization Code; state = 32 random bytes, stored as sha256 hash bound to admin user, 10 min expiry, single use |
| Client | spotifyApi: host/path/param allowlist (resolveSpotifyApiUrl), 10s timeout, redirect:error, one short 429 retry (Retry-After ≤ 3s) |
| Requests | POST accounts.spotify.com/api/token<br>GET /v1/me<br>GET /v1/playlists/{id}?fields=id,name,snapshot_id,owner(id)<br>GET /v1/playlists/{id}/items?limit=50&offset=N&additional_types=track (≤200 pages) |
| Raw response | PlaylistItemsPage; items.item|track; album release_date + precision; images filtered to i.scdn.co |
| Normalization | dedupe by track id; sort by release date (precision-aware) then added_at then id; keep 5; only https open.spotify.com track/album URLs |
| Identity | spotify_playlist_id derived from URL (spotifyPlaylistIdFromUrl); spotify_user_id from /me. Spotify artist IDs (from artist links) are a Soundcharts resolution input only. |
| Persistence | spotify_release_cache positions 1..5 (replaced in one transaction); lander_records_integration_settings.spotify_*; spotify_oauth_states |
| Consumers | app/(public)/page.tsx release cards via getHomeSpotifyReleaseFeed |
| Fallback | cache valid 6h; stale cache served up to 7 days; home triggers refresh when due with 5 min cooldown after an error |
| Error handling | spotify_last_error persisted; home logs [spotify-home] without secrets |
| Retry | cron every 6h + on-demand refresh from home when due |
| Rate limit | 429 with Retry-After ≤3s retried once; otherwise error |
| Timeout | 10s |
| Observability | spotify_last_synced_at / spotify_last_error; tests/spotify-security.test.cjs |
