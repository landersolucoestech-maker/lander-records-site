import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  OUTBOX_BASE_RETRY_DELAY_MS,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_MAX_RETRY_DELAY_MS,
  isPermanentDeliveryStatus,
  outboxFailureTransition,
} from "../../lib/contact-outbox-policy.ts";

const now = new Date("2026-09-25T12:00:00Z");

test("transient failures back off exponentially and stay retryable", () => {
  const delays = [1, 2, 3, 4].map((attempts) => outboxFailureTransition(attempts, 503, now).nextAttemptAt.getTime() - now.getTime());
  assert.deepEqual(delays, [1, 2, 4, 8].map((factor) => factor * OUTBOX_BASE_RETRY_DELAY_MS));
  assert.equal(outboxFailureTransition(1, null, now).status, "failed", "network errors and timeouts are retryable");
});

test("backoff is capped", () => {
  const transition = outboxFailureTransition(OUTBOX_MAX_ATTEMPTS - 1, 500, now);
  assert.equal(transition.status, "failed");
  assert.ok(transition.nextAttemptAt.getTime() - now.getTime() <= OUTBOX_MAX_RETRY_DELAY_MS);
});

test("the retry budget ends in dead letter instead of retrying forever", () => {
  assert.deepEqual(outboxFailureTransition(OUTBOX_MAX_ATTEMPTS, 503, now), { status: "dead_letter", nextAttemptAt: null });
});

test("permanent receiver rejections dead-letter immediately; throttling does not", () => {
  for (const status of [400, 404, 410, 422]) {
    assert.equal(isPermanentDeliveryStatus(status), true, String(status));
    assert.equal(outboxFailureTransition(1, status, now).status, "dead_letter");
  }
  for (const status of [401, 403, 408, 425, 429, 500, 502, 503, null]) {
    assert.equal(isPermanentDeliveryStatus(status), false, String(status));
  }
});

test("credential rejections stay retryable within the budget (one-sided secret rotation)", () => {
  assert.equal(outboxFailureTransition(1, 401, now).status, "failed");
  assert.equal(outboxFailureTransition(OUTBOX_MAX_ATTEMPTS, 403, now).status, "dead_letter");
});

test("webhook delivery refuses redirects and never logs the raw error text", () => {
  const contact = fs.readFileSync(new URL("../../lib/contact.ts", import.meta.url), "utf8");
  assert.match(contact, /redirect: "error"/);
  assert.doesNotMatch(contact, /contact_outbox_dead_letter", JSON\.stringify\(\{ outboxId, attempts, error: message/);
});

test("dispatch persists the policy decision and schema/migration expose dead_letter", () => {
  const contact = fs.readFileSync(new URL("../../lib/contact.ts", import.meta.url), "utf8");
  assert.match(contact, /outboxFailureTransition\(attempts, error instanceof OutboxDeliveryError \? error\.httpStatus : null\)/);
  assert.doesNotMatch(contact, /nextAttemptAt: new Date\(Date\.now\(\) \+ 15 \* 60 \* 1000\)/);
  const schema = fs.readFileSync(new URL("../../lib/db/schema.ts", import.meta.url), "utf8");
  assert.match(schema, /outboxStatus = pgEnum\("outbox_status", \[[^\]]*"dead_letter"\]/);
  const migration = fs.readFileSync(new URL("../../migrations/0018_outbox_dead_letter.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER TYPE outbox_status ADD VALUE IF NOT EXISTS 'dead_letter'/);
});
