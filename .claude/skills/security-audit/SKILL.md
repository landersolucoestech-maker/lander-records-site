---
name: security-audit
description: "Audit authn/authz, trust boundaries, secrets and abuse paths. (lander-records-site)"
---

# security-audit

## INPUT
Scope

## PRECONDITIONS
- —

## PROCEDURE
1. npm run test:auth; node --test tests/unit/public-boundaries.test.mjs tests/spotify-security.test.cjs
2. Check every app/admin page/action calls requireAdmin
3. Check rate-limit identity, HMAC, OAuth state
4. Scan for secrets in repo and logs

## OUTPUT
Security findings (L5)

## FAILURE MODES
- —

## EVIDENCE REQUIRED
test EV + review EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
adversarial-review
