# Supabase Storage integration agent

Mode: `storage-sdk`

Persistent media storage for CMS uploads via @supabase/supabase-js with the server-only service role key (lib/storage/supabase-storage.ts).

## Owns
- lib/storage/index.ts uploadMedia/deleteMedia (dynamic import)
- media_assets

## Responsibilities
- Keep the full chain CONFIG → CREDENTIALS → AUTH → CLIENT → REQUEST → RESPONSE → NORMALIZATION → IDENTITY → PERSISTENCE → SERVICE → API → FRONTEND → FALLBACK → ERRORS → RETRY → RATE LIMIT → OBSERVABILITY correct and documented in contract.md
- Run auditor.md on every change touching the files above
- Update state/integrations.yml only with evidence

## Routing
Lead: `integrations-lead` role is played by `backend-lead` for code and `integrity-lead` for data; reviewer: `integration-reviewer`. Workflow: `workflow.md`.
