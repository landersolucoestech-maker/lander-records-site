---
name: incident-recovery
description: "Handle a live problem. (lander-records-site)"
---

# incident-recovery

## INPUT
Symptom

## PRECONDITIONS
- —

## PROCEDURE
1. Open INC from templates/incident.md
2. Contain (disable cron/webhook via env, not code deletion)
3. Preserve evidence (logs, rows) before changes
4. Diagnose → mitigate → recover → validate → root cause → prevention finding

## OUTPUT
incidents/INC-NNNN.md

## FAILURE MODES
- Data loss/credential exposure → operator now

## EVIDENCE REQUIRED
timeline + EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
root-cause-analysis
