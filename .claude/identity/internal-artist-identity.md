# Internal artist identity

- Canonical: `artists.id`. Slugs change (history in `slug_redirects`); ids never do.
- Archived artists (`archived_at` not null) are skipped by `syncAllArtistSoundcharts`.
- Deleting an artist cascades to `artist_external_identities`, `artist_metrics`, `artist_metric_history`, links (ON DELETE CASCADE).
- `integration_metric_cache.entity_id` stores the artist id as text (entity_type='artist'); it has **no FK**. `deleteArtistAction` (app/admin/artist-actions.ts) deletes the artist's cache rows in the same transaction; any other deletion path (scripts, manual SQL, tests) must do the same. The `identity-conflicts` sensor reports orphans.
