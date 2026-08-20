import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth";
import { createSpotifyAuthorizationUrl } from "../../../../../lib/integrations/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin("editor");
    const authorizationUrl = await createSpotifyAuthorizationUrl(session.user.id);
    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(new URL("/admin/settings/lander-records?spotify=error", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }
}
