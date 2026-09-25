# Dead-letter controller

`dead_letter` rows are terminal: never re-claimed. Operator reconciliation: inspect last_error; fix the receiver or the payload cause; re-queue explicitly with an audited statement (`UPDATE integration_outbox SET status='failed', attempts=0, next_attempt_at=now() WHERE id=...`) through the guarded data-change path. Sensor `lead-delivery` reports any dead letter as a P1 signal.
