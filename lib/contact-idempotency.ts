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
