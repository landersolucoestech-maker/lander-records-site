# Signed lead webhook (receiver-agnostic) — contract (as implemented)

| Stage | Implementation |
|---|---|
| Config | LANDER_SAAS_WEBHOOK_URL; LANDER_SAAS_WEBHOOK_SECRET |
| Credentials | shared HMAC secret; signature header x-lander-signature: sha256=<hex HMAC of raw body> |
| Authentication | HMAC-SHA256 over the exact JSON body; receiver must verify and dedupe on x-lander-event-id |
| Client | lib/contact.ts#dispatchOutboxEvent (fetch POST, 4s abort timeout) |
| Requests | POST {LANDER_SAAS_WEBHOOK_URL} body {id,type:'site.contact.submitted',aggregateType:'contact_submission',aggregateId,occurredAt,data} |
| Raw response | any 2xx = delivered; non-2xx/network = failure classified by lib/contact-outbox-policy.ts |
| Normalization | payload built at submission time (email lowercased, consent version 2026-08, attribution: source, pagePath, referrer, utm) |
| Identity | event id = integration_outbox.id (stable across retries) → receiver idempotency key |
| Persistence | integration_outbox (pending|delivered|failed|disabled|dead_letter, attempts, last_error, next_attempt_at, delivered_at) |
| Consumers | external receiver (not configured) |
| Fallback | lead always persisted first; delivery failure never loses the submission |
| Error handling | last_error (truncated 2000 chars); dead letter logged contact_outbox_dead_letter {outboxId, attempts, error} |
| Retry | exponential from 15 min, ×2, cap 24h; 8 attempts; retryDueOutboxEvents claims ≤25 (max 100) under advisory lock with 15 min claim window; stale pending (>5 min) recovered |
| Rate limit | 429 treated as transient |
| Timeout | 4s |
| Observability | sensor lead-delivery (dead_letter/failed/disabled counts), lead-reconciliation |
