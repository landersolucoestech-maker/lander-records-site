---
name: cross-provider-reconciliation
description: "Reconcile links × identity × metrics per artist. (lander-records-site)"
---

# cross-provider-reconciliation

## INPUT
DATABASE_URL

## PRECONDITIONS
- read-only DB access

## PROCEDURE
1. Run sensor identity-conflicts
2. For each artist compare artist_links platforms with metrics platforms and matched_via
3. Classify mismatches per identity/cross-provider-reconciler.md

## OUTPUT
Mismatch list → findings

## FAILURE MODES
- DB unavailable → BLOCKED

## EVIDENCE REQUIRED
sensor EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
metrics-audit
