import { createHmac, createHash } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { contactSubmissions, integrationOutbox } from "./db/schema";
import { outboxFailureTransition } from "./contact-outbox-policy";

class OutboxDeliveryError extends Error {
  readonly httpStatus: number | null;
  constructor(message: string, httpStatus: number | null) {
    super(message);
    this.httpStatus = httpStatus;
  }
}

const OUTBOX_RETRY_BATCH_SIZE = 25;
const OUTBOX_RETRY_MAX_BATCH_SIZE = 100;
const OUTBOX_PENDING_RECOVERY_MS = 5 * 60 * 1000;
const OUTBOX_RETRY_CLAIM_MS = 15 * 60 * 1000;
const OUTBOX_RETRY_LOCK_KEY = 1735289204;

export function hashIp(ip: string) {
  const salt = process.env.CONTACT_IP_HASH_SALT;
  if (!salt) {
    throw new Error("CONTACT_IP_HASH_SALT is required before enabling the public contact endpoint.");
  }
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function isContactRateLimited(ipHash: string) {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const rows = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(contactSubmissions)
    .where(and(eq(contactSubmissions.ipHash, ipHash), gte(contactSubmissions.createdAt, since)));
  return (rows[0]?.count ?? 0) >= 5;
}

export async function retryDueOutboxEvents(limit = OUTBOX_RETRY_BATCH_SIZE) {
  const batchSize = Math.max(1, Math.min(Math.trunc(limit), OUTBOX_RETRY_MAX_BATCH_SIZE));
  const db = getDb();
  const now = new Date();
  const stalePendingBefore = new Date(now.getTime() - OUTBOX_PENDING_RECOVERY_MS);
  const claimUntil = new Date(now.getTime() + OUTBOX_RETRY_CLAIM_MS);

  const claimedIds = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${OUTBOX_RETRY_LOCK_KEY})`);
    const rows = await tx
      .select({ id: integrationOutbox.id })
      .from(integrationOutbox)
      .where(or(
        and(
          eq(integrationOutbox.status, "failed"),
          or(isNull(integrationOutbox.nextAttemptAt), lte(integrationOutbox.nextAttemptAt, now)),
        ),
        and(
          eq(integrationOutbox.status, "pending"),
          lte(integrationOutbox.createdAt, stalePendingBefore),
          or(isNull(integrationOutbox.nextAttemptAt), lte(integrationOutbox.nextAttemptAt, now)),
        ),
      ))
      .orderBy(asc(integrationOutbox.createdAt))
      .limit(batchSize);

    const ids = rows.map((row) => row.id);
    if (!ids.length) return ids;

    await tx
      .update(integrationOutbox)
      .set({ nextAttemptAt: claimUntil, updatedAt: now })
      .where(inArray(integrationOutbox.id, ids));
    return ids;
  });

  let delivered = 0;
  let failed = 0;
  let disabled = 0;
  for (const id of claimedIds) {
    const result = await dispatchOutboxEvent(id);
    if (result.delivered) delivered += 1;
    else if (result.reason === "integration_not_configured") disabled += 1;
    else failed += 1;
  }

  return { claimed: claimedIds.length, delivered, failed, disabled };
}

export async function dispatchOutboxEvent(outboxId: string) {
  const url = process.env.LANDER_SAAS_WEBHOOK_URL;
  const secret = process.env.LANDER_SAAS_WEBHOOK_SECRET;
  const db = getDb();

  if (!url || !secret) {
    await db
      .update(integrationOutbox)
      .set({ status: "disabled", updatedAt: new Date() })
      .where(eq(integrationOutbox.id, outboxId));
    return { delivered: false, reason: "integration_not_configured" };
  }

  const rows = await db.select().from(integrationOutbox).where(eq(integrationOutbox.id, outboxId)).limit(1);
  const event = rows[0];
  if (!event) return { delivered: false, reason: "not_found" };

  const body = JSON.stringify({
    id: event.id,
    type: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    occurredAt: event.createdAt.toISOString(),
    data: event.payload,
  });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-lander-event-id": event.id,
        "x-lander-signature": `sha256=${signature}`,
      },
      body,
      // Never re-send the signed personal data to a redirect target.
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OutboxDeliveryError(`SaaS webhook returned ${response.status}`, response.status);
    }

    await db
      .update(integrationOutbox)
      .set({
        status: "delivered",
        attempts: event.attempts + 1,
        deliveredAt: new Date(),
        lastError: "",
        updatedAt: new Date(),
      })
      .where(eq(integrationOutbox.id, outboxId));

    return { delivered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    const attempts = event.attempts + 1;
    const transition = outboxFailureTransition(attempts, error instanceof OutboxDeliveryError ? error.httpStatus : null);
    await db
      .update(integrationOutbox)
      .set({
        status: transition.status,
        attempts,
        lastError: message.slice(0, 2000),
        nextAttemptAt: transition.nextAttemptAt,
        updatedAt: new Date(),
      })
      .where(eq(integrationOutbox.id, outboxId));
    if (transition.status === "dead_letter") {
      // Only the HTTP status class is logged; full error text (which can embed the receiver URL) stays in last_error.
      const logged = /^SaaS webhook returned \d{3}$/.test(message) ? message : "delivery error (see integration_outbox.last_error)";
      console.error("contact_outbox_dead_letter", JSON.stringify({ outboxId, attempts, error: logged }));
    }
    return { delivered: false, reason: message };
  } finally {
    clearTimeout(timer);
  }
}
