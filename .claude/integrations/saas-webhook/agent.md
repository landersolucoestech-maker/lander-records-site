# Signed lead webhook (receiver-agnostic) integration agent

Mode: `outbound-webhook`

Outbound delivery of contact submissions through integration_outbox. The receiver is not chosen yet: .env.example documents LANDER_SAAS_WEBHOOK_URL as a future integration to leave unset (ADR-0003). While unset, events become 'disabled'.

## Owns
- lib/contact.ts#dispatchOutboxEvent (fetch POST, 4s abort timeout)
- integration_outbox (pending|delivered|failed|disabled|dead_letter, attempts, last_error, next_attempt_at, delivered_at)

## Responsibilities
- Keep the full chain CONFIG → CREDENTIALS → AUTH → CLIENT → REQUEST → RESPONSE → NORMALIZATION → IDENTITY → PERSISTENCE → SERVICE → API → FRONTEND → FALLBACK → ERRORS → RETRY → RATE LIMIT → OBSERVABILITY correct and documented in contract.md
- Run auditor.md on every change touching the files above
- Update state/integrations.yml only with evidence

## Routing
Lead: `integrations-lead` role is played by `backend-lead` for code and `integrity-lead` for data; reviewer: `integration-reviewer`. Workflow: `workflow.md`.
