# Integration orchestrator

Real orchestration in lander-records-site:

| Trigger | Code | Work |
|---|---|---|
| Hosting scheduler every 6h → `GET /api/cron/integrations/` with `Authorization: Bearer $CRON_SECRET` | `app/api/cron/integrations/route.ts` | `syncAllIntegrations(false)` + `retryDueOutboxEvents()` in parallel |
| Admin actions | `app/admin/integration-actions.ts`, `app/admin/artist-actions.ts` | forced sync for Lander Records / one artist |
| Spotify OAuth callback | `app/api/integrations/spotify/callback/route.ts` | exchange code, then `syncSpotifyReleases(true)` |
| Home render | `getHomeSpotifyReleaseFeed` | refresh playlist cache when due (5 min error cooldown) |
| Contact submit | `app/api/contact/route.ts` | immediate `dispatchOutboxEvent` |

`syncAllIntegrations` runs Spotify → Lander Soundcharts → every non-archived artist sequentially; each unit's error is captured and returned, never aborting the batch.

Providers: [soundcharts](../soundcharts/agent.md) · [spotify](../spotify/agent.md) · [instagram](../instagram/agent.md) · [youtube](../youtube/agent.md) · [tiktok](../tiktok/agent.md) · [soundcloud](../soundcloud/agent.md) · [saas-webhook](../saas-webhook/agent.md) · [supabase-storage](../supabase-storage/agent.md)

Audit order for a full integration audit: soundcharts → spotify → saas-webhook → supabase-storage → instagram/youtube/tiktok/soundcloud (identity inputs). Workflow: `workflows/integration-full-audit.yml`.
