# Critical flows

Curated, code-anchored graphs: `graphs/lead.flow.json`, `graphs/metric.flow.json`, `graphs/identity.flow.json`, `graphs/release-feed.flow.json`, `graphs/features.flow.json` (validated by `runtime/graph.mjs check`).

1. **Contact → lead**: ContactForm → /api/contact/ → contact_submissions + integration_outbox (tx) → dispatchOutboxEvent → receiver (unset → disabled) · retry via cron.
2. **Artist metrics**: artist_links → resolveSoundchartsArtist → artist_external_identities → fetchSoundchartsArtistMetrics → artist_metrics / history / cache → modules/artists/repository → /artistas/[slug]/.
3. **Home social**: Lander instagram/youtube URLs → Soundcharts identity → integration_metric_cache(lander_records) → getLanderRecordsSocialMetrics → home cards ('—' if absent).
4. **Home releases**: Spotify OAuth (encrypted refresh token) → playlist items → 5 newest releases → spotify_release_cache → getHomeSpotifyReleaseFeed → release cards.
5. **CMS content**: /admin managers → server actions (requireAdmin + audit_logs) → pages/posts/artists tables → public pages; media via sharp → Supabase Storage.
