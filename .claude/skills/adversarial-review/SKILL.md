---
name: adversarial-review
description: "Independently try to break a change. (lander-records-site)"
---

# adversarial-review

## INPUT
Diff + claims

## PRECONDITIONS
- implementation finished

## PROCEDURE
1. Dispatch reviewers/adversarial-reviewer.md (and domain reviewer) with the diff range only
2. Require VERDICT line
3. Record with evidence.mjs review

## OUTPUT
Review report + EV

## FAILURE MODES
- FAIL → FIXING

## EVIDENCE REQUIRED
review EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
reaudit via auditor
