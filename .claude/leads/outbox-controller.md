# Outbox controller

Table `integration_outbox`; states: pending → delivered | failed → (retry) → delivered | dead_letter; disabled when no receiver configured.
Mapping to the mission lifecycle: RECEIVED/VALIDATED (route) → QUEUED (pending row committed with submission) → DELIVERING (claimed by retryDueOutboxEvents or immediate dispatch) → DELIVERED (delivered) · FAILED_RETRYABLE (failed + next_attempt_at) · FAILED_PERMANENT (dead_letter).
Durability: submission and outbox row are inserted in one transaction — a lead can never exist without its event or vice versa.
