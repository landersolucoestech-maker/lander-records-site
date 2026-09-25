# Contact form controller

Real flow (verified in code and by tests/browser/contact-form.spec.ts):

`ContactForm.tsx` (client) → `POST /api/contact/` → zod `payloadSchema` → honeypot (`website` must be empty) → trusted client IP (`resolveContactClientIp`) → salted hash → rate limit 5/10 min → idempotency lookup → topic active check → transaction { insert contact_submissions, insert integration_outbox } → `dispatchOutboxEvent` → 201 {ok,id,integration: delivered|queued}.

Responses: 201 created · 200 duplicate (same idempotency key) · 422 validation/inactive topic · 429 rate limit · 503 configuration (salt/DB) · 500 generic.
UI states: sending (button disabled) · success (role=status, form reset, key rotated) · error (role=alert, readable PT-BR, key kept for retry).
