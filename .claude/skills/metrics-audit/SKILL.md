---
name: metrics-audit
description: "Audit metric semantics end to end. (lander-records-site)"
---

# metrics-audit

## INPUT
Platform/metric

## PRECONDITIONS
- data-flow-trace

## PROCEDURE
1. Check no `|| 0` / `?? 0` on metric values
2. Check observedAt null semantics
3. Check render rules ('—' vs > 0 filter)
4. Check purge-on-identity-change test passes

## OUTPUT
Metric findings

## FAILURE MODES
- —

## EVIDENCE REQUIRED
grep + test EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
metric-freshness
