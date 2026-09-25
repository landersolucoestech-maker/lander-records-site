# Resolver (lib/integrations/soundcharts.ts#resolveSoundchartsArtist)

Order:
1. Spotify artist URL → `/api/v2.9/artist/by-platform/spotify/{id}` → UUID → verify.
2. For platform in [youtube, instagram, tiktok, soundcloud, spotify]: normalized URL → `/api/v2/search/external/url` → must contain an item of type artist → UUID → verify.
3. None verified → `null` → identity `needs_review` (never "first search result by name").

Verification (`verifyIdentifier`): `/api/v2/artist/{uuid}/identifiers` must list a URL whose normalized form equals the normalized source URL. 403 ⇒ not verified; other errors propagate.
