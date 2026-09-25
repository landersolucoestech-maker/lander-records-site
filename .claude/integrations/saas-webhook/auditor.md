# Signed lead webhook (receiver-agnostic) — auditor checklist

1. Configuration documented in .env.example / docs (LANDER_SAAS_WEBHOOK_URL, LANDER_SAAS_WEBHOOK_SECRET)
2. Credential handling server-only; encrypted at rest where persisted
3. Client behavior: lib/contact.ts#dispatchOutboxEvent (fetch POST, 4s abort timeout)
4. Timeout present (4s); redirect policy safe
5. Retry semantics: exponential from 15 min, ×2, cap 24h; 8 attempts; retryDueOutboxEvents claims ≤25 (max 100) under advisory lock with 15 min claim window; stale pending (>5 min) recovered; permanent failures not retried
6. Normalization: payload built at submission time (email lowercased, consent version 2026-08, attribution: source, pagePath, referrer, utm)
7. Identity: event id = integration_outbox.id (stable across retries) → receiver idempotency key
8. Persistence consistent: integration_outbox (pending|delivered|failed|disabled|dead_letter, attempts, last_error, next_attempt_at, delivered_at)
9. Consumers render truthfully: external receiver (not configured)
10. Fallback does not mask errors: lead always persisted first; delivery failure never loses the submission
11. Observability: sensor lead-delivery (dead_letter/failed/disabled counts), lead-reconciliation

Output: findings (domain integrations or identity) + update of state/integrations.yml dimensions with evidence ids.
