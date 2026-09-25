# Lead retry controller

`retryDueOutboxEvents(limit=25, max 100)`: advisory transaction lock 1735289204; selects failed rows due and stale pending rows (>5 min); sets next_attempt_at = now+15 min as claim; dispatches sequentially. Backoff after failure: 15 min × 2^(attempts−1), cap 24h; attempt 8 → dead_letter (ADR-0004).
