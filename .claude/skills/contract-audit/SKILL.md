---
name: contract-audit
description: "Verify producer/consumer agreement of a contract. (lander-records-site)"
---

# contract-audit

## INPUT
Contract (route, envelope, table)

## PRECONDITIONS
- schemas/ entry exists

## PROCEDURE
1. Compare schema with producer code
2. Compare with every consumer
3. Check versioning for breaking change

## OUTPUT
Contract findings

## FAILURE MODES
- No schema → create from code

## EVIDENCE REQUIRED
diff notes — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
integration-audit
