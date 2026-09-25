# metrics rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Source 'soundcharts' is the only producer of artist/lander metrics; CMS metric fields are read-only.
- Stores: artist_metrics (public read model), artist_metric_history (append-only), integration_metric_cache (keyed entity/platform/metric) — all written by sync.ts in one transaction per artist.
- Freshness: Soundcharts 24h, Spotify 6h (stale ≤7 days served).
- Public artist page shows only metrics with value > 0; home shows '—' when absent.
