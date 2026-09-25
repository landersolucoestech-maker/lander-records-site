# Internal artist identity

- Canonical: `artists.id`. Slugs change (history in `slug_redirects`); ids never do.
- Archived artists (`archived_at` not null) are skipped by `syncAllArtistSoundcharts`.
- Deleting an artist cascades to `artist_external_identities`, `artist_metrics`, `artist_metric_history`, links (ON DELETE CASCADE).
- `integration_metric_cache.entity_id` stores the artist id as text (entity_type='artist'); it has **no FK** — rows can outlive the artist. The `identity-conflicts` sensor reports orphans.
