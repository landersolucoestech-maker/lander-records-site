import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { register } from "node:module";
import postgres from "postgres";

register("../support/ts-resolve-hooks.mjs", import.meta.url);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");

// Real HTTP receiver on loopback: exercises signing, status handling and persistence end to end.
let nextStatus = 200;
const received = [];
const server = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    received.push({ headers: request.headers, body });
    response.writeHead(nextStatus, nextStatus === 308 ? { location: "http://127.0.0.1:9/elsewhere" } : { "content-type": "application/json" });
    response.end("{}");
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const secret = `outbox-secret-${randomUUID()}`;
process.env.LANDER_SAAS_WEBHOOK_URL = `http://127.0.0.1:${server.address().port}/leads`;
process.env.LANDER_SAAS_WEBHOOK_SECRET = secret;

const { dispatchOutboxEvent, retryDueOutboxEvents } = await import("../../lib/contact.ts");
const client = postgres(databaseUrl, { max: 1 });
const created = [];

async function outboxEvent(overrides = {}) {
  const [row] = await client`
    INSERT INTO integration_outbox (event_type, aggregate_type, aggregate_id, payload, status, attempts, next_attempt_at, created_at)
    VALUES ('site.contact.submitted', 'contact_submission', ${randomUUID()}, ${client.json({ test: true })},
            ${overrides.status ?? "pending"}, ${overrides.attempts ?? 0}, ${overrides.nextAttemptAt ?? null}, ${overrides.createdAt ?? new Date()})
    RETURNING id
  `;
  created.push(row.id);
  return row.id;
}
async function state(id) {
  const [row] = await client`SELECT status, attempts, next_attempt_at, last_error, delivered_at FROM integration_outbox WHERE id=${id}`;
  return row;
}

try {
  // Delivered: signed body, terminal delivered state.
  nextStatus = 200;
  const ok = await outboxEvent();
  assert.deepEqual(await dispatchOutboxEvent(ok), { delivered: true });
  const last = received.at(-1);
  assert.equal(last.headers["x-lander-signature"], `sha256=${createHmac("sha256", secret).update(last.body).digest("hex")}`);
  assert.equal((await state(ok)).status, "delivered");

  // Transient 503: retryable with the first backoff step.
  nextStatus = 503;
  const transient = await outboxEvent();
  const before = Date.now();
  await dispatchOutboxEvent(transient);
  const transientState = await state(transient);
  assert.equal(transientState.status, "failed");
  assert.equal(transientState.attempts, 1);
  const delayMs = transientState.next_attempt_at.getTime() - before;
  assert.ok(delayMs > 14 * 60 * 1000 && delayMs < 16 * 60 * 1000, `first retry ~15min, got ${delayMs}`);

  // Permanent 422: dead letter immediately, never retried.
  nextStatus = 422;
  const rejected = await outboxEvent();
  await dispatchOutboxEvent(rejected);
  const rejectedState = await state(rejected);
  assert.equal(rejectedState.status, "dead_letter");
  assert.equal(rejectedState.next_attempt_at, null);
  assert.match(rejectedState.last_error, /422/);

  // Credential rejection (e.g. one-sided secret rotation) stays retryable.
  nextStatus = 401;
  const unauthorized = await outboxEvent();
  await dispatchOutboxEvent(unauthorized);
  assert.equal((await state(unauthorized)).status, "failed");

  // A redirecting receiver never receives a second signed POST.
  nextStatus = 308;
  const redirected = await outboxEvent();
  const before308 = received.length;
  await dispatchOutboxEvent(redirected);
  assert.equal(received.length, before308 + 1, "the signed body is not re-sent to a redirect target");
  assert.equal((await state(redirected)).status, "failed");

  // Retry budget exhausted: dead letter.
  nextStatus = 503;
  const exhausted = await outboxEvent({ status: "failed", attempts: 7, nextAttemptAt: new Date(Date.now() - 1000) });
  await dispatchOutboxEvent(exhausted);
  assert.equal((await state(exhausted)).status, "dead_letter");

  // The scheduler never re-claims dead-letter rows.
  await client`UPDATE integration_outbox SET next_attempt_at=NULL WHERE id=${rejected}`;
  const deliveriesBefore = received.length;
  const otherDue = [...await client`
    SELECT id FROM integration_outbox
    WHERE id <> ALL(${created}) AND (status='failed' OR status='pending') AND (next_attempt_at IS NULL OR next_attempt_at <= now())
  `];
  assert.equal(otherDue.length, 0, "test database must not hold unrelated due outbox rows");
  await retryDueOutboxEvents(25);
  const replayed = received.slice(deliveriesBefore).map((item) => JSON.parse(item.body).id);
  assert.ok(!replayed.includes(rejected) && !replayed.includes(exhausted), "dead-letter events must not be retried");

  console.log("Contact outbox delivery checks passed: signed delivery, exponential retry, permanent-rejection and exhausted-budget dead letter, no dead-letter replay.");
} finally {
  if (created.length) await client`DELETE FROM integration_outbox WHERE id = ANY(${created})`;
  await client.end();
  await globalThis.__landerRecordsDb?.client?.end();
  server.close();
}
