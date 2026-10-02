import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../lib/db";
import { contactSubmissions, contactTopics, integrationOutbox } from "../../../lib/db/schema";
import { dispatchOutboxEvent, hashIp, isContactRateLimited } from "../../../lib/contact";

const payloadSchema = z.object({
  idempotencyKey: z.string().uuid(),
  name: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(80).optional().default(""),
  topicSlug: z.string().trim().min(1).max(180),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(""),
  source: z.literal("lander-records-site"),
  pagePath: z.string().max(1000).optional().default(""),
  referrer: z.string().max(2000).optional().default(""),
  utm: z.object({
    source: z.string().max(500).optional().default(""),
    medium: z.string().max(500).optional().default(""),
    campaign: z.string().max(500).optional().default(""),
    term: z.string().max(500).optional().default(""),
    content: z.string().max(500).optional().default(""),
  }).optional().default({ source: "", medium: "", campaign: "", term: "", content: "" }),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = payloadSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Revise os campos obrigatórios do formulário.", details: parsed.error.flatten() }, { status: 422 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
    const ipHash = hashIp(ip);

    if (await isContactRateLimited(ipHash)) {
      return Response.json({ error: "Muitas tentativas em pouco tempo. Tente novamente em alguns minutos." }, { status: 429 });
    }

    const db = getDb();
    const existing = await db
      .select({ id: contactSubmissions.id })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.idempotencyKey, parsed.data.idempotencyKey))
      .limit(1);

    if (existing[0]) {
      return Response.json({ ok: true, id: existing[0].id, duplicate: true });
    }

    const topicRows = await db
      .select()
      .from(contactTopics)
      .where(eq(contactTopics.slug, parsed.data.topicSlug))
      .limit(1);
    const topic = topicRows[0];
    if (!topic || !topic.active) {
      return Response.json({ error: "O assunto selecionado não está disponível." }, { status: 422 });
    }

    const result = await db.transaction(async (tx) => {
      const submissionRows = await tx.insert(contactSubmissions).values({
        idempotencyKey: parsed.data.idempotencyKey,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        topicId: topic.id,
        message: parsed.data.message,
        consent: true,
        consentVersion: "2026-08",
        consentAt: new Date(),
        source: parsed.data.source,
        pagePath: parsed.data.pagePath,
        referrer: parsed.data.referrer,
        utmSource: parsed.data.utm.source,
        utmMedium: parsed.data.utm.medium,
        utmCampaign: parsed.data.utm.campaign,
        utmTerm: parsed.data.utm.term,
        utmContent: parsed.data.utm.content,
        userAgent: request.headers.get("user-agent") || "",
        ipHash,
        status: "new",
      }).returning({ id: contactSubmissions.id, createdAt: contactSubmissions.createdAt });

      const submission = submissionRows[0];

      const outboxRows = await tx.insert(integrationOutbox).values({
        eventType: "site.contact.submitted",
        aggregateType: "contact_submission",
        aggregateId: submission.id,
        payload: {
          contactSubmissionId: submission.id,
          idempotencyKey: parsed.data.idempotencyKey,
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          phone: parsed.data.phone,
          topic: { slug: topic.slug, name: topic.name, saasType: topic.saasType },
          message: parsed.data.message,
          consent: { accepted: true, version: "2026-08", at: submission.createdAt.toISOString() },
          attribution: {
            source: parsed.data.source,
            pagePath: parsed.data.pagePath,
            referrer: parsed.data.referrer,
            utm: parsed.data.utm,
          },
        },
      }).returning({ id: integrationOutbox.id });

      return { submissionId: submission.id, outboxId: outboxRows[0].id };
    });

    const delivery = await dispatchOutboxEvent(result.outboxId);
    return Response.json({ ok: true, id: result.submissionId, integration: delivery.delivered ? "delivered" : "queued" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("contact_submission_failed", message);
    const configurationError = message.includes("CONTACT_IP_HASH_SALT") || message.includes("DATABASE_URL");
    return Response.json(
      { error: configurationError ? "O formulário está temporariamente indisponível por configuração do servidor." : "Não foi possível registrar o contato." },
      { status: configurationError ? 503 : 500 },
    );
  }
}
