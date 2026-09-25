---
name: integration-health-check
description: "Compute health per provider from evidence. (lander-records-site)"
---

# integration-health-check

## INPUT
state/integrations.yml

## PRECONDITIONS
- audits done

## PROCEDURE
1. Apply integrations/orchestrator/health-controller.md rules
2. Never HEALTHY without live-call evidence

## OUTPUT
Updated health values

## FAILURE MODES
- Missing evidence → UNKNOWN

## EVIDENCE REQUIRED
EV ids per dimension — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
cross-provider-reconciliation
