---
name: dependency-trace
description: "Find everything affected by a file/symbol change. (lander-records-site)"
---

# dependency-trace

## INPUT
File or symbol

## PRECONDITIONS
- graphs current

## PROCEDURE
1. Reverse edges in graphs/dependencies.json
2. grep symbol usages incl. tests
3. List routes impacted (graphs/routes.json)

## OUTPUT
Impact list

## FAILURE MODES
- String-based references (tests reading source) → grep

## EVIDENCE REQUIRED
list with paths — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
impact-analysis
