import { NextResponse } from "next/server";
import { getAdminAuthorization } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, decision } = await getAdminAuthorization();
  if (decision === "unauthenticated" || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (decision !== "authorized") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    principal: session.source,
    role: session.user.role,
  });
}
