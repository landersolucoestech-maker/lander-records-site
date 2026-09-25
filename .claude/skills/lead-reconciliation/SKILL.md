---
name: lead-reconciliation
description: "Reconcile submissions × outbox (× receiver when one exists). (lander-records-site)"
---

# lead-reconciliation

## INPUT
DATABASE_URL

## PRECONDITIONS
- read-only DB

## PROCEDURE
1. Run sensor lead-reconciliation
2. Explain every discrepancy or open a finding

## OUTPUT
Reconciliation report

## FAILURE MODES
- No DB → BLOCKED

## EVIDENCE REQUIRED
sensor EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
release-validation
