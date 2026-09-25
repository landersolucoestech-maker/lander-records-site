---
name: repository-map
description: "Build producer → consumer maps for critical features. (lander-records-site)"
---

# repository-map

## INPUT
graphs/*.json

## PRECONDITIONS
- graphs built

## PROCEDURE
1. Run graph.mjs build
2. For each curated flow (graphs/*.flow.json) verify nodes' code refs (graph.mjs check)
3. Add missing flows for new features

## OUTPUT
graphs/*.flow.json current

## FAILURE MODES
- Symbol moved → re-anchor node

## EVIDENCE REQUIRED
graph.mjs check PASS — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
feature-trace
