import { NextRequest, NextResponse } from "next/server";
import { retryDueOutboxEvents } from "../../../../lib/contact";
import { syncAllIntegrations } from "../../../../lib/integrations/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const [result, outbox] = await Promise.all([
    syncAllIntegrations(false),
    retryDueOutboxEvents(),
  ]);
  return NextResponse.json({ ok: true, result, outbox });
}
