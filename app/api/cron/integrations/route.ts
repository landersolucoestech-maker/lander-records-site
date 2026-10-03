import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { retryDueOutboxEvents } from "../../../../lib/contact";
import { syncAllIntegrations } from "../../../../lib/integrations/sync";

export const dynamic = "force-dynamic";

function authorized(actual: string | null, secret: string) {
  if (!actual?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(actual.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false }, { status: 401 });
  const [result, outbox] = await Promise.all([
    syncAllIntegrations(false),
    retryDueOutboxEvents(),
  ]);
  return NextResponse.json({ ok: true, result, outbox });
}
