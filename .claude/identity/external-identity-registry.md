# External identity registry

Rules for each external identifier:
1. Stored exactly once per entity (artist_external_identities is keyed by artist_id).
2. Carries provenance: `matched_via_platform` + `matched_via_identifier` (Spotify id or normalized URL); Lander uses `soundcharts_matched_via = '<platform>:<normalizedUrl>'`.
3. Carries lifecycle: `resolution_status` unresolved → resolved | needs_review | error, `last_resolved_at`, `last_synced_at`, `last_error`.
4. Is invalidated when its provenance no longer matches current links (`resolutionStillMatches`) — and its metrics are purged (fix F-0003).
