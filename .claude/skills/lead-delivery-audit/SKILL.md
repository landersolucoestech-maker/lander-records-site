---
name: lead-delivery-audit
description: "Prove the lead pipeline works. (lander-records-site)"
---

# lead-delivery-audit

## INPUT
Local build + *_test DB

## PRECONDITIONS
- db migrated

## PROCEDURE
1. npm run test:integration (contact outbox delivery)
2. Build, start, E2E_CONTACT_SUBMIT=1 playwright contact spec
3. Run sensor lead-delivery

## OUTPUT
Lead health evidence

## FAILURE MODES
- Rate limit hit in E2E → clear test submissions in the disposable DB only

## EVIDENCE REQUIRED
EV records — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
lead-reconciliation
