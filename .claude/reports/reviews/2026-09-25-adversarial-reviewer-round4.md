# Review — adversarial-reviewer — round 4 (51358aa..71e8a4c)

Independent read-only review dispatched by the mission controller (clone /var/tmp/adv4 at 71e8a4c, disposable DB restored afterwards). Reproduced from the reviewer's hand-back (condensed; findings and verdict verbatim in substance).

REVIEW-TICKET: 4b361fa0b6c28cc32e0f25aa4dcb8f5b

Ran: soundcharts-identity-sync.mjs exit 0 on HEAD, exit 1 with base sync.ts; contact-outbox-delivery.mjs exit 0, exit 1 without `redirect: "error"`; contact-outbox-policy 7/7; runtime tests 21/21 (hooks fails only in /var/tmp clone).

Prior items: A admin-save purge PARTIAL; B sync/admin race PARTIAL; C env-prefix bypass PARTIAL (npm config files); D redirect test CLOSED; E requiredTests binding PARTIAL.

## HIGH
1. F-0003 — `lib/integrations/sync.ts` Lander (~145-155) and artist (~247-257): the pre-fetch identity write is unconditional; a sync that resolved old URL A, released after an admin save to URL B and a forced sync of B, overwrites the identity with X (matched via A) and publishes X's metrics (artist history keeps them).
2. F-0017 — `lib/io.mjs` childEnv: user `~/.npmrc` (via HOME) or project `.npmrc` with `script-shell=/bin/true` makes `npm run test:claude-os` / `typecheck` record PASS with no tests; completion re-runs the same way; `npm config set` passes the hook.

## MEDIUM
1. `app/admin/integration-actions.ts` purge runs before the settings row lock (uncommitted publish rows survive); a cleared identity with cached metrics is never withdrawn while credentials are missing (withdrawal only when `uuid && !stillMatches`); `app/admin/artist-actions.ts` same shape.
2. `lib/findings.mjs` matchesRequiredTests: substring match over the whole command (env value can carry the path); completion does not apply it; requiredTests not anchored in git; fails open when empty.

## LOW
1. ranNothing misses all-skipped/todo runs (`# pass 0`).
2. Build freshness compares BUILD_ID mtime only.
3. Hook quote-concatenation / expansion bypasses (pre-existing).

## INFO
Mission weakening by abort + new mission id (visible in history).

VERDICT: FAIL
