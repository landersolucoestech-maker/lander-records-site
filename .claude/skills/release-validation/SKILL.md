---
name: release-validation
description: "Validate release readiness. (lander-records-site)"
---

# release-validation

## INPUT
Commit

## PRECONDITIONS
- CI green

## PROCEDURE
1. node .claude/runtime/gate.mjs release --record
2. Check migrations guarded path and backups
3. Smoke after deploy (npm run smoke)

## OUTPUT
Release record

## FAILURE MODES
- Production write without authorization → stop

## EVIDENCE REQUIRED
gate EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
—
