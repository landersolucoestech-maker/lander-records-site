"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { landerRecordsIntegrationSettings, spotifyReleaseCache } from "../../lib/db/integration-schema";
import { normalizeExternalUrl, spotifyPlaylistIdFromUrl } from "../../lib/integrations/identity";
import { syncAllIntegrations } from "../../lib/integrations/sync";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function saveLanderRecordsIntegrationSettings(formData: FormData) {
  const session = await requireAdmin("editor");
  const instagramUrl = normalizeExternalUrl(text(formData, "instagramUrl"));
  const youtubeUrl = normalizeExternalUrl(text(formData, "youtubeUrl"));
  const spotifyPlaylistUrl = normalizeExternalUrl(text(formData, "spotifyPlaylistUrl"));
  const spotifyPlaylistId = spotifyPlaylistUrl ? spotifyPlaylistIdFromUrl(spotifyPlaylistUrl) : "";
  const db = getDb();
  const current = (await db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, "lander_records")).limit(1))[0];
  const socialChanged = !current || current.instagramUrl !== instagramUrl || current.youtubeUrl !== youtubeUrl;
  const playlistChanged = !current || current.spotifyPlaylistId !== spotifyPlaylistId;

  await db.insert(landerRecordsIntegrationSettings).values({
    key: "lander_records",
    instagramUrl,
    youtubeUrl,
    spotifyPlaylistUrl,
    spotifyPlaylistId,
    soundchartsArtistUuid: socialChanged ? "" : current?.soundchartsArtistUuid || "",
    soundchartsResolutionStatus: socialChanged ? "unresolved" : current?.soundchartsResolutionStatus || "unresolved",
    soundchartsMatchedVia: socialChanged ? "" : current?.soundchartsMatchedVia || "",
    soundchartsLastResolvedAt: socialChanged ? null : current?.soundchartsLastResolvedAt || null,
    soundchartsLastSyncedAt: socialChanged ? null : current?.soundchartsLastSyncedAt || null,
    soundchartsLastError: socialChanged ? "" : current?.soundchartsLastError || "",
    spotifyPlaylistSnapshotId: playlistChanged ? "" : current?.spotifyPlaylistSnapshotId || "",
    spotifyLastSyncedAt: playlistChanged ? null : current?.spotifyLastSyncedAt || null,
    spotifyLastError: playlistChanged ? "" : current?.spotifyLastError || "",
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: landerRecordsIntegrationSettings.key,
    set: {
      instagramUrl,
      youtubeUrl,
      spotifyPlaylistUrl,
      spotifyPlaylistId,
      soundchartsArtistUuid: socialChanged ? "" : current?.soundchartsArtistUuid || "",
      soundchartsResolutionStatus: socialChanged ? "unresolved" : current?.soundchartsResolutionStatus || "unresolved",
      soundchartsMatchedVia: socialChanged ? "" : current?.soundchartsMatchedVia || "",
      soundchartsLastResolvedAt: socialChanged ? null : current?.soundchartsLastResolvedAt || null,
      soundchartsLastSyncedAt: socialChanged ? null : current?.soundchartsLastSyncedAt || null,
      soundchartsLastError: socialChanged ? "" : current?.soundchartsLastError || "",
      spotifyPlaylistSnapshotId: playlistChanged ? "" : current?.spotifyPlaylistSnapshotId || "",
      spotifyLastSyncedAt: playlistChanged ? null : current?.spotifyLastSyncedAt || null,
      spotifyLastError: playlistChanged ? "" : current?.spotifyLastError || "",
      updatedAt: new Date(),
    },
  });
  if (playlistChanged) await db.delete(spotifyReleaseCache);
  await audit(session.user.id, "integration.lander_records.updated", "integration_settings", "lander_records", {
    instagramConfigured: Boolean(instagramUrl),
    youtubeConfigured: Boolean(youtubeUrl),
    spotifyPlaylistConfigured: Boolean(spotifyPlaylistId),
  });
  revalidatePath("/");
  revalidatePath("/admin/settings/lander-records");
  redirect("/admin/settings/lander-records?saved=1");
}

export async function syncLanderRecordsIntegrationsAction() {
  const session = await requireAdmin("editor");
  const result = await syncAllIntegrations(true);
  await audit(session.user.id, "integration.sync.requested", "integration_settings", "lander_records", {
    spotifyStatus: result.spotify.status,
    landerSoundchartsStatus: result.landerSoundcharts.status,
    artistCount: result.artistsSoundcharts.length,
    artistErrors: result.artistsSoundcharts.filter((item) => item.status === "error").length,
  });
  revalidatePath("/");
  revalidatePath("/artistas");
  revalidatePath("/admin/settings/lander-records");
  revalidatePath("/admin/artists");
  redirect("/admin/settings/lander-records?synced=1");
}
