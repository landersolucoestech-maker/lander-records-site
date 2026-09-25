export const OUTBOX_BASE_RETRY_DELAY_MS = 15 * 60 * 1000;
export const OUTBOX_MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;
export const OUTBOX_MAX_ATTEMPTS = 8;

// 408/425/429 are transient by definition; every other 4xx means the receiver rejected
// this exact payload and repeating it cannot succeed.
const TRANSIENT_CLIENT_STATUSES = new Set([408, 425, 429]);

export type OutboxFailureTransition =
  | { status: "failed"; nextAttemptAt: Date }
  | { status: "dead_letter"; nextAttemptAt: null };

export function isPermanentDeliveryStatus(httpStatus: number | null) {
  return httpStatus !== null && httpStatus >= 400 && httpStatus < 500 && !TRANSIENT_CLIENT_STATUSES.has(httpStatus);
}

/** Decides the state after a failed delivery attempt. `attempts` already includes the failed one. */
export function outboxFailureTransition(attempts: number, httpStatus: number | null, now = new Date()): OutboxFailureTransition {
  if (isPermanentDeliveryStatus(httpStatus) || attempts >= OUTBOX_MAX_ATTEMPTS) {
    return { status: "dead_letter", nextAttemptAt: null };
  }
  const exponent = Math.max(0, attempts - 1);
  const delay = Math.min(OUTBOX_BASE_RETRY_DELAY_MS * 2 ** exponent, OUTBOX_MAX_RETRY_DELAY_MS);
  return { status: "failed", nextAttemptAt: new Date(now.getTime() + delay) };
}
