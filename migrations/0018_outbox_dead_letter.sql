BEGIN;

-- Terminal state for outbox events that can no longer succeed: the receiver rejected the
-- payload permanently (non-transient 4xx) or the bounded retry budget was exhausted.
-- Additive enum value only; no existing row changes state. Retry selection never picks
-- dead_letter rows, so they wait for explicit operator reconciliation.
ALTER TYPE outbox_status ADD VALUE IF NOT EXISTS 'dead_letter';

COMMIT;
