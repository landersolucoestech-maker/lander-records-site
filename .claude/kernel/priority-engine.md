# Priority engine

Implementation: `runtime/lib/findings.mjs#priorityScore`.

score = severity (P0 1000, P1 500, P2 200, P3 50) + domain weight (security 150, leads 120, identity 100, database 80, integrations 60, seo 40) + confidence (confirmed 60, high 40, medium 20, low 0) − correction risk (high 60, medium 20).
Findings with unresolved dependencies (another open finding or any DEC) are excluded from the READY queue. Ties break by id.
