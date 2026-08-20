import { createHmac, createHash } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { contactSubmissions, integrationOutbox } from "./db/schema";

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
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`SaaS webhook returned ${response.status}`);
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
    await db
      .update(integrationOutbox)
      .set({
        status: "failed",
        attempts: event.attempts + 1,
        lastError: message.slice(0, 2000),
        nextAttemptAt: new Date(Date.now() + 15 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(integrationOutbox.id, outboxId));
    return { delivered: false, reason: message };
  } finally {
    clearTimeout(timer);
  }
}
