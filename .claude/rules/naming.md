# naming rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Code, identifiers, commits, file names: English; user-facing text: PT-BR with correct accents.
- DB snake_case (contact_submissions.idempotency_key) ↔ Drizzle camelCase (idempotencyKey).
- Enum values stay technical (new|processing|exported|spam|archived); UI shows humanized PT-BR labels.
- Finding ids F-NNNN, evidence EV-NNNN, decisions ADR-NNNN / DEC-NNNN, incidents INC-NNNN.
