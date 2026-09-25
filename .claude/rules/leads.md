# leads rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- System of record: contact_submissions; delivery: integration_outbox; see leads/*.md.
- Idempotency key per completed attempt; retries keep the key.
- Rate limit on trusted client IP hash (lib/contact-client-ip.ts).
- No new form fields, destinations or replays without a product decision (DEC-0001/0002).
