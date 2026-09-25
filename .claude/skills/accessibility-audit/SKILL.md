---
name: accessibility-audit
description: "Audit keyboard, labels, live regions and dialogs. (lander-records-site)"
---

# accessibility-audit

## INPUT
Changed UI

## PRECONDITIONS
- —

## PROCEDURE
1. Static review of labels/roles/aria-hidden
2. Keyboard walk-through with Playwright
3. Check dialogs focus trap/restore

## OUTPUT
A11y findings

## FAILURE MODES
- —

## EVIDENCE REQUIRED
browser EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
visual-audit
