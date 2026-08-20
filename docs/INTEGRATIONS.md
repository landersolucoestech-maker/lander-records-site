# Lander Records — Spotify + Soundcharts integrations

## Purpose

The public site and CMS share one server-side integration layer. React components do not call Spotify or Soundcharts directly and no private credential is exposed through `NEXT_PUBLIC_*`, HTML, browser storage, or client JavaScript.

Flow:

`CMS configuration -> identity resolution -> provider client -> normalization -> PostgreSQL cache -> internal service -> public frontend`

## Lander Records configuration

CMS route: `/admin/settings/lander-records`

User-managed values:

- official Instagram URL;
- official YouTube URL/channel;
- Spotify playlist URL used for the five Home release cards.

Resolved provider identifiers, OAuth tokens, synchronization timestamps and errors are internal fields. The CMS does not require the user to paste provider IDs when they can be derived safely from an official URL.

## Spotify

### Authentication

The implementation uses Spotify Authorization Code flow. The authorized Spotify account must have access to the configured playlist under the current Spotify Web API rules. Private secrets remain server-side.

Environment variables:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `INTEGRATION_TOKEN_ENCRYPTION_KEY`

The refresh token returned by Spotify is encrypted at rest with AES-256-GCM before being stored in PostgreSQL.

### Five latest releases

The CMS stores only the playlist URL and its derived playlist ID. Synchronization:

1. reads all playlist items with pagination;
2. ignores entries that are not Spotify tracks with valid album metadata;
3. deduplicates tracks belonging to the same album/release using Spotify album ID;
4. orders releases by the album `release_date`, respecting Spotify's `release_date_precision`;
5. uses playlist `added_at` only as a deterministic tie-break when release dates have the same effective precision/date;
6. keeps the five newest distinct releases;
7. writes exactly positions 1..5 to `spotify_release_cache` in one transaction.

The Home keeps the existing release-card markup/classes and reads those cached five rows. Each card links back to the Spotify album and uses Spotify album artwork without modifying it.

A successful cache is valid for six hours. If a later provider request fails, the last successful cache is preserved; the public reader accepts a last-known-good cache for up to seven days instead of breaking the page.

## Soundcharts

### Authentication

New integration code uses Soundcharts OAuth client credentials rather than the deprecated legacy API-key headers.

Environment variables:

- `SOUNDCHARTS_CLIENT_ID`
- `SOUNDCHARTS_CLIENT_SECRET`
- `SOUNDCHARTS_TEAM_ID` (optional, only when required by the Soundcharts account/team setup)

The OAuth access token is held only in server memory and refreshed when necessary.

### Deterministic artist matching

Name-only matching is intentionally not used.

For each artist, the integration reuses the platform URLs already stored by the Artists CMS module. Resolution priority:

1. exact Spotify artist ID from the official Spotify artist URL through Soundcharts `by-platform` resolution;
2. exact official platform URL through Soundcharts external-URL resolution for YouTube, Instagram, TikTok, SoundCloud, then Spotify;
3. where plan access permits, the returned Soundcharts UUID is verified against the artist identifiers endpoint.

If the URLs do not produce a deterministic artist identity, the record is left in `needs_review`; the system does not choose the first search result by name.

Resolved identities are persisted in `artist_external_identities` and invalidated when platform URLs change.

### Artist metrics

Source for the artist social/platform metrics is Soundcharts:

- Instagram followers;
- YouTube subscribers;
- TikTok followers;
- SoundCloud followers;
- Spotify monthly listeners.

The existing `artist_metrics` table is the normalized public read model. CMS metric fields are read-only; saving an artist cannot overwrite the metrics manually.

### Lander Records social metrics

The official Instagram and YouTube URLs configured under `/admin/settings/lander-records` are resolved through the same deterministic Soundcharts identity mechanism. The Home reads only cached Soundcharts values for:

- Instagram followers;
- YouTube subscribers.

When no real synchronized value exists, the UI renders an unavailable state (`—`) instead of an invented number.

## Cache and resilience

- Spotify release refresh window: 6 hours.
- Soundcharts social refresh window: 24 hours. This intentionally avoids a provider request on every pageview and is compatible with social-stat refresh frequencies that are not real-time.
- Scheduled server sync: `/api/cron/integrations`, protected by `CRON_SECRET` and scheduled every six hours in `vercel.json`; Soundcharts internally skips while its 24-hour cache remains fresh.
- Provider errors are persisted for CMS observability.
- A failed external request does not zero or delete the last valid metric/release values.
- Soundcharts 429 responses are surfaced as rate-limit errors; Spotify respects `Retry-After` for short retries.

## Secret handling

Never commit real values to GitHub. `.env.example` contains names only.

For local development use `.env.local`. For deployed environments configure the secret store of the Node/Next runtime separately for Development, Preview/Staging, and Production.

No integration secret uses a `NEXT_PUBLIC_*` variable.

## Operational validation

After credentials are provisioned:

1. open `/admin/settings/lander-records`;
2. save official Instagram, YouTube and Spotify playlist URLs;
3. connect the Spotify account using the server-side OAuth button;
4. run `Sincronizar integrações agora`;
5. confirm a resolved Soundcharts UUID and synchronization timestamp;
6. confirm the real Instagram/YouTube values in CMS and Home;
7. confirm exactly five Spotify cache positions and five Home cards ordered by release date;
8. edit an artist's existing official platform URLs, save, and verify the deterministic Soundcharts identity and refreshed metrics on the individual artist page;
9. check provider errors and network responses server-side without printing tokens or secrets.
