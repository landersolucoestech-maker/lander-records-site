---
name: autofix
description: "Implement the minimal correct fix for a confirmed root cause. (lander-records-site)"
---

# autofix

## INPUT
Finding ROOT_CAUSE_CONFIRMED

## PRECONDITIONS
- red test exists
- preflight captured

## PROCEDURE
1. Transition to FIXING
2. Edit only the owning layer and consumers of changed contracts
3. Run red test → green
4. Run npm test, typecheck, integration as applicable
5. Transition to VALIDATING with evidence

## OUTPUT
Patch + green evidence

## FAILURE MODES
- Second failure from the change → self-heal loop
- Fix needs product input → NEEDS_PRODUCT_DECISION

## EVIDENCE REQUIRED
EV records red and green — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
regression-generation
