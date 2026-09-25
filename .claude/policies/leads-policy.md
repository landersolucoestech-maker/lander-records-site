# leads-policy

## Policy
A lead is persisted before any delivery attempt; delivery is outbox-based, idempotent, bounded, with dead letter; no PII in logs; no credentials in the browser.

## Enforcement
lead-delivery gate; lead sensors.
