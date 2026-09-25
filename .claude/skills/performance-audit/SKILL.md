---
name: performance-audit
description: "Find evidenced performance issues. (lander-records-site)"
---

# performance-audit

## INPUT
Hot path

## PRECONDITIONS
- —

## PROCEDURE
1. Measure (build output sizes, server timing, query counts)
2. Look for N+1 and sequential awaits

## OUTPUT
Findings with measurements

## FAILURE MODES
- No measurement → no finding

## EVIDENCE REQUIRED
measurement EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
release-validation
