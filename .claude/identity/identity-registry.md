# Identity registry

| Identity | Kind | Where stored | Produced by | Proven by |
|---|---|---|---|---|
| `artists.id` (uuid) | internal artist | `artists` | CMS create | primary key |
| `lander_records` | internal label entity | `lander_records_integration_settings.key` | migration seed | constant |
| Soundcharts artist UUID | external | `artist_external_identities.soundcharts_artist_uuid`, `lander_records_integration_settings.soundcharts_artist_uuid` | `resolveSoundchartsArtist` | identifiers endpoint lists the exact source URL |
| Spotify artist ID | external | derived from `artist_links.url` (open.spotify.com/artist/{id}) | `spotifyArtistIdFromUrl` | URL host+path pattern |
| Spotify playlist ID / user ID | external | `lander_records_integration_settings.spotify_playlist_id / spotify_user_id` | `spotifyPlaylistIdFromUrl`, `/v1/me` | OAuth + URL pattern |
| Instagram / YouTube / TikTok / SoundCloud profile | external URL | `artist_links` (platform, url), Lander `instagram_url`/`youtube_url` | CMS input, `normalizePlatformUrl` | host allowlist only — not an identity proof |
| Lead event id | delivery identity | `integration_outbox.id` | contact route | uuid |
| Contact idempotency key | request identity | `contact_submissions.idempotency_key` (unique) | browser `crypto.randomUUID` | unique index |
