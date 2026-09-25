# ADR-0004 — Bounded outbox retry with a `dead_letter` terminal state

- Status: ACCEPTED (implemented in commit "fix(contact): bounded exponential outbox retry with dead-letter terminal state")
- Date: 2026-09-25

## Context

`dispatchOutboxEvent` retried every 15 minutes forever, including receiver rejections (4xx) that cannot succeed. There was no terminal state for operators to reconcile.

## Decision

- Pure policy in `lib/contact-outbox-policy.ts`: delay = 15 min × 2^(attempts−1), capped at 24 h; non-transient 4xx (all except 401/403/408/425/429) or attempt 8 ⇒ `dead_letter`.
- Migration `0018_outbox_dead_letter.sql` adds the enum value only (additive; no row changes). Retry selection never picks `dead_letter`.
- `contact_outbox_dead_letter` is logged with outbox id, attempts and truncated error (no payload/PII).

## Rollback

Code rollback is safe (old code never writes `dead_letter`). The enum value cannot be dropped without a type rebuild; leaving it unused is harmless. Rows already in `dead_letter` would need `UPDATE integration_outbox SET status='failed', next_attempt_at=now() WHERE status='dead_letter'` before a code rollback if re-delivery is wanted (a data write → guarded release process).

## Release

Remote databases require the guarded path (`scripts/migrate.mjs` refuses non-local targets without `MIGRATION_RELEASE_GUARD`). See `workflows/database-change.yml`.
