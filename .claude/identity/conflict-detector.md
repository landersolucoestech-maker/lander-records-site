# Conflict detector

Conflicts that must become findings (domain identity):
| Conflict | Detection |
|---|---|
| Same Soundcharts UUID resolved for two artists | sensor identity-conflicts probe `duplicate-uuid` |
| Artist resolved but UUID empty / unresolved with UUID | probe `status-uuid-mismatch` |
| Metrics published without resolved identity | probe `metrics-without-identity` |
| Cache rows for missing artists | probe `orphan-metric-cache` |
| Lander Records UUID equals an artist UUID | probe `lander-equals-artist` (only valid if the label *is* that artist — decision required) |
