# api rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- /api/contact/ POST: 201 {ok,id,integration} · 200 {duplicate:true} · 422 · 429 · 500 · 503.
- /api/health/ GET: 200 {status,application,database} | 503.
- /api/admin/status/ GET: 401 unauthenticated · 403 forbidden · 200.
- /api/cron/integrations/ GET: 503 if CRON_SECRET unset · 401 bad bearer · 200 {result,outbox}.
- /api/integrations/spotify/connect|callback: admin editor+, OAuth state bound to user, redirects to /admin/settings/lander-records?spotify=connected|error.
- Changing a response shape requires updating schemas/ and consumers in the same change.
