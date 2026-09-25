# Spotify integration agent

Mode: `api-client`

Authorization Code OAuth for the account owning the Home 'Últimos Lançamentos' playlist; lib/integrations/spotify.ts reads playlist items and caches the five newest distinct releases.

## Owns
- spotifyApi: host/path/param allowlist (resolveSpotifyApiUrl), 10s timeout, redirect:error, one short 429 retry (Retry-After ≤ 3s)
- spotify_release_cache positions 1..5 (replaced in one transaction)
- lander_records_integration_settings.spotify_*
- spotify_oauth_states

## Responsibilities
- Keep the full chain CONFIG → CREDENTIALS → AUTH → CLIENT → REQUEST → RESPONSE → NORMALIZATION → IDENTITY → PERSISTENCE → SERVICE → API → FRONTEND → FALLBACK → ERRORS → RETRY → RATE LIMIT → OBSERVABILITY correct and documented in contract.md
- Run auditor.md on every change touching the files above
- Update state/integrations.yml only with evidence

## Routing
Lead: `integrations-lead` role is played by `backend-lead` for code and `integrity-lead` for data; reviewer: `integration-reviewer`. Workflow: `workflow.md`.
