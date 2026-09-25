---
name: metric-freshness
description: "Detect stale metrics. (lander-records-site)"
---

# metric-freshness

## INPUT
DATABASE_URL

## PRECONDITIONS
- read-only DB

## PROCEDURE
1. Run sensor metric-freshness
2. For stale entries read last_error to classify provider vs identity vs credentials

## OUTPUT
Freshness findings

## FAILURE MODES
- No DB → BLOCKED

## EVIDENCE REQUIRED
sensor EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
integration-health-check
