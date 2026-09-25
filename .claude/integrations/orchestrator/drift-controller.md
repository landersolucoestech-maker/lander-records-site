# Drift controller

Provider contract drift = response no longer matching what the parsers expect.

Detection in this codebase:
- Soundcharts parsers are shape-tolerant (recursive walks). Drift shows as `metrics.length === 0` for an artist that previously had values, or identity `needs_review` after being resolved without link changes. The `metric-freshness` sensor flags resolved identities whose `last_synced_at` is older than 48h; `identity-conflicts` flags one UUID on two artists.
- Spotify: tracks skipped when `type !== 'track'` or album metadata missing → cache shrinks below 5 while playlist has items.
- Webhook: receiver 4xx after previously delivering → dead letters with the same status.

Response: open a finding (domain integrations), capture a sanitized raw payload sample as evidence (no tokens), update `schemas/` and the parser in the owning client, add a unit test with the new shape.
