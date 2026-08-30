import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth";
import { completeSpotifyAuthorization, spotifyAdminRedirectUrl } from "../../../../../lib/integrations/spotify";
import { syncSpotifyReleases } from "../../../../../lib/integrations/sync";

export const dynamic = "force-dynamic";

function adminRedirect(status: "connected" | "error") {
  return NextResponse.redirect(spotifyAdminRedirectUrl(status));
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin("editor");
  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError || !code || !state) return adminRedirect("error");

  try {
    await completeSpotifyAuthorization(code, state, session.user.id);
    await syncSpotifyReleases(true).catch(() => null);
    return adminRedirect("connected");
  } catch {
    return adminRedirect("error");
  }
}
