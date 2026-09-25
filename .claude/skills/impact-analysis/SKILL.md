---
name: impact-analysis
description: "Classify impact level L0–L5 and required reviewers/gates. (lander-records-site)"
---

# impact-analysis

## INPUT
Planned change

## PRECONDITIONS
- dependency-trace done

## PROCEDURE
1. Match touched paths against kernel/risk-engine.md L5 surfaces
2. Count cross-module edges
3. Pick reviewers and gates from registry routing

## OUTPUT
impactLevel + reviewer/gate list

## FAILURE MODES
- Unsure → higher level

## EVIDENCE REQUIRED
written classification in finding — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
autofix
