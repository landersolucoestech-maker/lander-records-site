# Finding state machine

Authoritative table: `runtime/lib/findings.mjs#TRANSITIONS` (tests assert this document matches).

| From | To |
|---|---|
| DISCOVERED | TRIAGED, DUPLICATED, FALSE_POSITIVE, OBSOLETE |
| TRIAGED | READY, NEEDS_PRODUCT_DECISION, BLOCKED_EXTERNAL, DUPLICATED, FALSE_POSITIVE, OBSOLETE |
| READY | INVESTIGATING, NEEDS_PRODUCT_DECISION, BLOCKED_EXTERNAL, DUPLICATED |
| INVESTIGATING | ROOT_CAUSE_CONFIRMED, FALSE_POSITIVE, NEEDS_PRODUCT_DECISION, BLOCKED_EXTERNAL |
| ROOT_CAUSE_CONFIRMED | FIXING, NEEDS_PRODUCT_DECISION, BLOCKED_EXTERNAL |
| FIXING | VALIDATING, INVESTIGATING |
| VALIDATING | REAUDITING, FIXING |
| REAUDITING | RESOLVED, FIXING |
| NEEDS_PRODUCT_DECISION | READY, OBSOLETE |
| BLOCKED_EXTERNAL | READY, OBSOLETE |
| RESOLVED | INVESTIGATING |

Guards: RESOLVED requires evidenceRecords; NEEDS_PRODUCT_DECISION requires a DEC record; every transition requires a note.

Mission states (runtime/mission.mjs): ACTIVE → COMPLETED (verdict A/B/C computed by lib/completion.mjs). A mission whose completion evaluates to D cannot be closed; it stays ACTIVE until remediated.

Guards enforced by runtime/lib/findings.mjs: history must start at DISCOVERED and replay legally; REAUDITING and RESOLVED need fresh PASS evidence naming the finding; NEEDS_PRODUCT_DECISION → READY needs the DEC marked DECIDED; entries written after the fact carry `reconstructed: true`.
