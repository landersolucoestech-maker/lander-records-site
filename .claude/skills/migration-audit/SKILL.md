---
name: migration-audit
description: "Validate a migration. (lander-records-site)"
---

# migration-audit

## INPUT
Migration file

## PRECONDITIONS
- local postgres available

## PROCEDURE
1. Fresh DB: npm run db:migrate
2. audit-db SCHEMA_DRIFT=PASS after contract capture
3. migration-path integration test
4. Classify additive/destructive; rollback note

## OUTPUT
Migration evidence

## FAILURE MODES
- Destructive → guarded release + DEC

## EVIDENCE REQUIRED
EV records — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
release-validation
