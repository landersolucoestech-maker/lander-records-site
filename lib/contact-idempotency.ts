export type RandomUuid = () => string;

export function createContactIdempotencyKey(randomUuid: RandomUuid = () => crypto.randomUUID()) {
  return randomUuid();
}

export function idempotencyKeyAfterAttempt(
  currentKey: string,
  completed: boolean,
  randomUuid: RandomUuid = () => crypto.randomUUID(),
) {
  return completed ? createContactIdempotencyKey(randomUuid) : currentKey;
}


export function isContactIdempotencyConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; constraint?: unknown };
  return candidate.code === "23505" && candidate.constraint === "contact_submissions_idempotency_key_key";
}
