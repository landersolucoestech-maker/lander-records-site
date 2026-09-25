# Lead reconciliation

Invariants checked by sensor `lead-reconciliation` (read-only SQL):
- every contact_submissions row has exactly one site.contact.submitted outbox row;
- every outbox row of that type references an existing submission;
- no pending row older than 30 min (dispatch or recovery stuck);
- delivered rows have delivered_at.
External reconciliation (receiver × site) becomes possible once a receiver exists and exposes delivered event ids.
