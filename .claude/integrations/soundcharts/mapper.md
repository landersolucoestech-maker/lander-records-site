# Soundcharts — mapper

- payload → SoundchartsMetric{platform, metric, value, observedAt}
- instagram/tiktok/soundcloud → followers; youtube → subscribers; spotify listening → monthly_listeners
- Lander Records keeps only instagram + youtube

Mapping code lives only in the client module (lib/integrations/soundcharts.ts); consumers never re-map provider payloads.
