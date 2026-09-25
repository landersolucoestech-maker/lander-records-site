# DEC-0002 — What happens to `disabled` outbox events when a webhook receiver is configured? (NEEDS_PRODUCT_DECISION)

- Status: OPEN — blocks finding F-0008

When `LANDER_SAAS_WEBHOOK_URL`/`SECRET` are unset, `dispatchOutboxEvent` marks events `disabled`, and `retryDueOutboxEvents` only selects `failed`/stale `pending`. Configuring a receiver later therefore never delivers historical leads.

Options: (A) keep history local — only new submissions are delivered (current behavior); (B) one-time replay of `disabled` events created after a cut-off date, via a guarded, idempotent operator script (receiver must dedupe on `x-lander-event-id`); (C) replay everything.

Replay sends personal data to a third party that did not exist at consent time (`consentVersion 2026-08`), so this is a product/legal decision, not an engineering default.
