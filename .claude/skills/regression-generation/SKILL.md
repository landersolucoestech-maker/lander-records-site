---
name: regression-generation
description: "Leave a permanent test that fails if the defect returns. (lander-records-site)"
---

# regression-generation

## INPUT
Fixed finding

## PRECONDITIONS
- fix applied

## PROCEDURE
1. Prefer behavioral tests (DB-backed integration, browser) over source-regex
2. Add source-contract assertions only where behavior can't be exercised in node
3. Wire new integration tests into npm run test:integration

## OUTPUT
New/updated test files

## FAILURE MODES
- Test not in any npm script → wire it

## EVIDENCE REQUIRED
test run EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
adversarial-review
