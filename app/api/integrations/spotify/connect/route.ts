import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth";
import { createSpotifyAuthorizationUrl, spotifyAdminRedirectUrl } from "../../../../../lib/integrations/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin("editor");
    const authorizationUrl = await createSpotifyAuthorizationUrl(session.user.id);
    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(spotifyAdminRedirectUrl("error"));
  }
}
