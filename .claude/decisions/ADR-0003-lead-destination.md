# ADR-0003 — The contact form's destinations are the site's own database and its outbox

- Status: ACCEPTED (records current architecture; see DEC-0001 for the open product decision)
- Date: 2026-09-25

## Evidence

- `app/api/contact/route.ts` validates with zod, rate-limits, persists `contact_submissions` and inserts an `integration_outbox` row (`site.contact.submitted`) in one transaction, then attempts delivery.
- `lib/contact.ts#dispatchOutboxEvent` POSTs an HMAC-SHA256 signed envelope (`x-lander-signature`, `x-lander-event-id`) to `LANDER_SAAS_WEBHOOK_URL`. `.env.example` documents it as "Future SaaS integration. Leave unset until the real SaaS endpoint exists." When unset the event becomes `disabled`.
- No email provider, CRM or third-party form service exists in the codebase.
- The admin dashboard counts submissions (`app/admin/(protected)/page.tsx`), but no admin screen lists or reads them.

## Decision

1. The canonical system of record for leads is `contact_submissions` in the site's PostgreSQL.
2. External delivery is the generic, receiver-agnostic signed webhook through `integration_outbox`. The pack models it as the `saas-webhook` integration; it does not assume or name any receiver.
3. The pack must not wire the form to any other product or invent an endpoint. Choosing a receiver, or building an internal reading surface, is a product decision (DEC-0001).

## Consequences

- Lead health is measured on the site's own tables (sensors `lead-delivery`, `lead-reconciliation`).
- `integrations/saas-webhook/` documents the outbound contract exactly as implemented.
