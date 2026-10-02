# Operational Automation Runtime Contract

Every automation is modeled as:
trigger -> authorize -> validate -> plan -> checkpoint -> execute -> verify -> evidence -> complete/recover.

Required envelope:
- run_id
- workflow
- actor / service identity
- correlation_id
- idempotency_key for side effects
- input schema version
- current state and requested transition
- authorization decision
- approval requirement/status
- attempt count
- timestamps
- result/error classification
- evidence references

Rules:
1. Read-only analysis may run automatically.
2. Draft generation may run automatically but must never masquerade as published state.
3. Publishing/unpublishing, destructive writes, permission changes, credential changes, external side effects and irreversible operations require an explicit approval gate unless a separately documented policy grants bounded automation.
4. Side effects must be idempotent and retry-safe.
5. Retry only transient failures; use bounded exponential backoff and preserve the same idempotency key.
6. Validation/auth/business-rule failures do not retry automatically.
7. A checkpoint is created before multi-step external or destructive operations.
8. Recovery must be deterministic: resume, compensate, rollback, or escalate.
9. Every decision and side effect emits structured evidence.
10. No agent may bypass application authorization or database constraints.

Initial workflows:
- content_publication_readiness
- approved_content_publication
- artist_profile_completeness
- media_validation
- seo_validation
- contact_routing
- integration_health
- operational_followup
