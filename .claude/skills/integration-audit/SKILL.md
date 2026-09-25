---
name: integration-audit
description: "Full chain audit of one provider. (lander-records-site)"
---

# integration-audit

## INPUT
Provider id

## PRECONDITIONS
- integrations/<id>/contract.md

## PROCEDURE
1. Run integrations/<id>/auditor.md checklist
2. Run sensors metric-freshness/identity-conflicts/lead-delivery/provider-timeouts as relevant
3. Update state/integrations.yml dimensions with evidence ids

## OUTPUT
Findings + health state

## FAILURE MODES
- Credentials unavailable → live dimensions UNKNOWN/BLOCKED_EXTERNAL

## EVIDENCE REQUIRED
sensor + test EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
integration-health-check
