---
name: feature-trace
description: "Trace one feature end to end (UI → route/action → service → DB → provider → back to UI). (lander-records-site)"
---

# feature-trace

## INPUT
Feature name or route

## PRECONDITIONS
- graphs current

## PROCEDURE
1. Start from graphs/routes.json entry
2. Follow imports in graphs/dependencies.json
3. Read each hop; note contracts, errors, fallbacks
4. Write the trace into the finding or knowledge/flows.md

## OUTPUT
Trace with file:line per hop

## FAILURE MODES
- Dynamic import/alias not in graph → read manually

## EVIDENCE REQUIRED
trace text with file:line — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
root-cause-analysis
