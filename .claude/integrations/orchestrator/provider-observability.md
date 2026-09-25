# Provider observability

Signals that exist today:
- Persisted: `soundcharts_last_error`, `soundcharts_last_synced_at`, `soundcharts_last_resolved_at`, `artist_external_identities.last_error/last_synced_at`, `spotify_last_error/spotify_last_synced_at`, `integration_outbox.status/attempts/last_error`.
- Logs: `contact_submission_failed`, `contact_outbox_dead_letter`, `[spotify-home]`.
- Endpoint: `/api/health/` (application + database).
- Cron response JSON: per-provider status and per-artist result list.

Gaps (findings when they cause harm): no latency metrics, no counters exported, no alerting on dead letters. Sensors (`node .claude/runtime/sensors.mjs run`) turn the persisted signals into findings.
