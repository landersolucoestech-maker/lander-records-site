---
name: visual-audit
description: "Detect visual regressions. (lander-records-site)"
---

# visual-audit

## INPUT
Running build

## PRECONDITIONS
- server started

## PROCEDURE
1. Run tests/browser/public-routes.spec.ts
2. Review screenshots in test-results for failures
3. Compare with state/known-failures.yml

## OUTPUT
Visual findings

## FAILURE MODES
- Browser binary mismatch → use preinstalled Chromium via launchOptions.executablePath in a local config (not committed)

## EVIDENCE REQUIRED
browser EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
responsive-audit
