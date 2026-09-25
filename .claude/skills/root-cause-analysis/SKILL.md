---
name: root-cause-analysis
description: "Confirm the root cause of a finding with a reproducing test. (lander-records-site)"
---

# root-cause-analysis

## INPUT
Finding id

## PRECONDITIONS
- Finding READY/INVESTIGATING

## PROCEDURE
1. Formulate hypothesis at the owning layer
2. Write the smallest failing test (unit/integration/browser)
3. Run it on the base commit: must fail for the stated reason
4. Transition finding to ROOT_CAUSE_CONFIRMED with the evidence id

## OUTPUT
Failing test + evidence

## FAILURE MODES
- Test passes on base → hypothesis wrong; back to trace
- Cannot reproduce without external system → BLOCKED_EXTERNAL

## EVIDENCE REQUIRED
EV record of the red run — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
autofix
