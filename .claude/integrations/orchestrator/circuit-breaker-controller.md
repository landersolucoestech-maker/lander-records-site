# Circuit breaker controller

Current state: **no circuit breaker exists** in the codebase. Blast radius is bounded instead by: per-request timeouts (Soundcharts/Spotify 10s, webhook 4s), per-unit error isolation in `syncAllIntegrations`, 6h cron cadence, 24h/6h freshness windows, and the outbox backoff.

Worst case today: Soundcharts down → each artist costs up to ~5 × 10s requests per cron run. At the current artist count this is acceptable; a breaker (skip provider for N minutes after K consecutive failures, persisted) becomes necessary if cron duration approaches the scheduler timeout. Tracked as a design note, not a defect, until measured.
