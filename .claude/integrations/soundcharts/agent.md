# Soundcharts integration agent

Mode: `api-client`

Critical metrics and identity provider. Server-only client in lib/integrations/soundcharts.ts; orchestration in lib/integrations/sync.ts; triggered by /api/cron/integrations (every 6h, 24h freshness) and admin actions.

## Owns
- lib/integrations/soundcharts.ts: getAccessToken, soundchartsRequest (10s timeout, redirect:error, 401 retry once, 429 → error with Retry-After, 404 → null)
- artist_external_identities (uuid, resolution_status unresolved|resolved|needs_review|error, matched_via_*)
- lander_records_integration_settings.soundcharts_*
- artist_metrics / artist_metric_history / integration_metric_cache

## Responsibilities
- Keep the full chain CONFIG → CREDENTIALS → AUTH → CLIENT → REQUEST → RESPONSE → NORMALIZATION → IDENTITY → PERSISTENCE → SERVICE → API → FRONTEND → FALLBACK → ERRORS → RETRY → RATE LIMIT → OBSERVABILITY correct and documented in contract.md
- Run auditor.md on every change touching the files above
- Update state/integrations.yml only with evidence

## Routing
Lead: `integrations-lead` role is played by `backend-lead` for code and `integrity-lead` for data; reviewer: `integration-reviewer`. Workflow: `workflow.md`.
