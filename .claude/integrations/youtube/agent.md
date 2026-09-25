# YouTube integration agent

Mode: `via-soundcharts`

No direct YouTube API client exists in lander-records-site. YouTube appears as (1) official profile URLs stored per artist in artist_links (platform='youtube') and for Lander Records in lander_records_integration_settings (youtube_url), (2) an identity input for Soundcharts resolution, (3) subscribers read from Soundcharts audience endpoints, (4) video embeds rendered through lib/media-embed.ts as youtube-nocookie.com/embed/{id}.

## Owns
- none — URL handling in lib/integrations/identity.ts (normalizeExternalUrl, normalizePlatformUrl, platformFromUrl)
- artist_metrics (platform='youtube', source='soundcharts')
- artist_metric_history
- integration_metric_cache (entity artist|lander_records)

## Responsibilities
- Keep the full chain CONFIG → CREDENTIALS → AUTH → CLIENT → REQUEST → RESPONSE → NORMALIZATION → IDENTITY → PERSISTENCE → SERVICE → API → FRONTEND → FALLBACK → ERRORS → RETRY → RATE LIMIT → OBSERVABILITY correct and documented in contract.md
- Run auditor.md on every change touching the files above
- Update state/integrations.yml only with evidence

## Routing
Lead: `integrations-lead` role is played by `backend-lead` for code and `integrity-lead` for data; reviewer: `integration-reviewer`. Workflow: `workflow.md`.
