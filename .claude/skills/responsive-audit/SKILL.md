---
name: responsive-audit
description: "Check breakpoints 320–1440px. (lander-records-site)"
---

# responsive-audit

## INPUT
Running build

## PRECONDITIONS
- server started

## PROCEDURE
1. Run public-routes spec per viewport
2. Check overflow and mobile nav

## OUTPUT
Findings

## FAILURE MODES
- —

## EVIDENCE REQUIRED
browser EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
accessibility-audit
