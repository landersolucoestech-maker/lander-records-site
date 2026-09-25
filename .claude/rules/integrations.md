# integrations rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- All provider code lives in lib/integrations/* (server only); cron orchestrates via lib/integrations/sync.ts.
- Timeout on every request (Spotify/Soundcharts 10s, webhook 4s); redirect:'error' when sending credentials.
- Persist provider errors to *_last_error fields; never zero or delete last valid values on provider failure of the same identity.
- Soundcharts OAuth client credentials only (no legacy API-key headers).
