import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { completeSpotifyAuthorization } from "../../../../../lib/integrations/spotify";
import { syncSpotifyReleases } from "../../../../../lib/integrations/sync";

export const dynamic = "force-dynamic";

function adminRedirect(request: NextRequest, status: "connected" | "error") {
  return NextResponse.redirect(new URL(`/admin/settings/lander-records?spotify=${status}`, request.url));
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url));
  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError || !code || !state) return adminRedirect(request, "error");

  try {
    await completeSpotifyAuthorization(code, state, session.user.id);
    await syncSpotifyReleases(true).catch(() => null);
    return adminRedirect(request, "connected");
  } catch {
    return adminRedirect(request, "error");
  }
}
