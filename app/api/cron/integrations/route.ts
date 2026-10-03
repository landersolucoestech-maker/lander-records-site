import { NextRequest, NextResponse } from "next/server";
import { retryDueOutboxEvents } from "../../../../lib/contact";
import { syncAllIntegrations } from "../../../../lib/integrations/sync";
import { safeCompare } from "../../../../lib/security";

export const dynamic = "force-dynamic";

function authorized(actual: string | null, secret: string) {
  if (!actual?.startsWith("Bearer ")) return false;
  return safeCompare(actual.slice(7), secret);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false }, { status: 401 });
  const [result, outbox] = await Promise.all([
    syncAllIntegrations(false),
    retryDueOutboxEvents(),
  ]);
  return NextResponse.json({ ok: true, result, outbox });
}
