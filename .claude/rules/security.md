# security rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- proxy.ts only checks cookie presence; every page/action/route must also call requireAdmin(role) server-side.
- DEV_AUTH_BYPASS only when NODE_ENV=development and loopback host; never trust it elsewhere.
- **Production-mode preview bypass** (`isDisposablePreviewAuthBypassEnabled`): NODE_ENV=production + GITHUB_ACTIONS=true + DEV_PREVIEW_PUBLIC_ACCESS=true and a loopback or `*.trycloudflare.com` host gives an **owner** session to anyone who reaches the tunnel (`.github/workflows/dev-preview.yml`). Acceptable only while the preview runs on the disposable service-container database with `LANDER_MOCK_DATA=1` and no provider/production secrets — enforced by `gates/security.json`. Any change to these conditions is L5.
- Secrets never in NEXT_PUBLIC_*; service role key server only.
- Cron endpoint requires Bearer CRON_SECRET; webhook bodies HMAC-signed.
- Login lockout: 5 failures → 15 min.
