---
name: lead-flow-trace
description: "Trace the contact form from UI to delivery. (lander-records-site)"
---

# lead-flow-trace

## INPUT
—

## PRECONDITIONS
- leads/*.md

## PROCEDURE
1. Follow leads/contact-form-controller.md hops in code
2. Verify each response code path
3. Verify transaction boundaries and outbox states

## OUTPUT
Trace + findings

## FAILURE MODES
- —

## EVIDENCE REQUIRED
trace text — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
lead-delivery-audit
