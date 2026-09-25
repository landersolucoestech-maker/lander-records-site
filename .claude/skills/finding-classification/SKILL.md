---
name: finding-classification
description: "Turn an observation into a contract-valid finding. (lander-records-site)"
---

# finding-classification

## INPUT
Observation

## PRECONDITIONS
- dedupe against findings.mjs list

## PROCEDURE
1. Fill every contract field; unknowns stated as unknown
2. Set severity (P0 data loss/security, P1 user-visible wrong behavior, P2 degraded/robustness, P3 hygiene)
3. Set autofix eligibility with reason
4. Save F-NNNN.json, run findings.mjs validate + index

## OUTPUT
findings/F-NNNN.json

## FAILURE MODES
- Contract violation → fix fields

## EVIDENCE REQUIRED
findings.mjs validate PASS — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
root-cause-analysis
