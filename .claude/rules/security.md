# security rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- proxy.ts only checks cookie presence; every page/action/route must also call requireAdmin(role) server-side.
- DEV_AUTH_BYPASS only when NODE_ENV=development and loopback host; never trust it elsewhere.
- Secrets never in NEXT_PUBLIC_*; service role key server only.
- Cron endpoint requires Bearer CRON_SECRET; webhook bodies HMAC-signed.
- Login lockout: 5 failures → 15 min.
