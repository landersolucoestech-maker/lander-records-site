import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { artistMetrics } from "../db/artist-management-schema";
import {
  artistExternalIdentities,
  integrationMetricCache,
  landerRecordsIntegrationSettings,
  spotifyReleaseCache,
} from "../db/integration-schema";
import { artistLinks, artists } from "../db/schema";
import { normalizeExternalUrl, spotifyArtistIdFromUrl } from "./identity";
import { fetchSoundchartsArtistMetrics, resolveSoundchartsArtist, soundchartsCredentialsConfigured } from "./soundcharts";
import { fetchLatestSpotifyPlaylistReleases, spotifyCredentialsConfigured } from "./spotify";

const LANDER_ENTITY_ID = "lander_records";
const SOUNDCHARTS_TTL_MS = 24 * 60 * 60 * 1000;
const SPOTIFY_TTL_MS = 6 * 60 * 60 * 1000;
const SPOTIFY_STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const ARTIST_PLATFORMS = ["instagram", "spotify", "youtube", "tiktok", "soundcloud"];

function isFresh(date: Date | null, ttlMs: number) {
  return Boolean(date && date.getTime() > Date.now() - ttlMs);
}

async function upsertCachedMetric(input: {
  entityType: string;
  entityId: string;
  platform: string;
  metric: string;
  value: number;
  observedAt: Date | null;
}) {
  await getDb().insert(integrationMetricCache).values({
    ...input,
    source: "soundcharts",
    fetchedAt: new Date(),
  }).onConflictDoUpdate({
    target: [integrationMetricCache.entityType, integrationMetricCache.entityId, integrationMetricCache.platform, integrationMetricCache.metric],
    set: { value: input.value, source: "soundcharts", observedAt: input.observedAt, fetchedAt: new Date() },
  });
}

function resolutionStillMatches(identity: typeof artistExternalIdentities.$inferSelect | undefined, links: Array<{ platform: string; url: string }>) {
  if (!identity?.soundchartsArtistUuid || identity.resolutionStatus !== "resolved") return false;
  if (identity.matchedViaPlatform === "spotify") {
    return links.some((link) => link.platform === "spotify" && spotifyArtistIdFromUrl(link.url) === identity.matchedViaIdentifier);
  }
  return links.some((link) => {
    if (link.platform !== identity.matchedViaPlatform) return false;
    try { return normalizeExternalUrl(link.url) === identity.matchedViaIdentifier; } catch { return false; }
  });
}

export async function syncLanderRecordsSoundcharts(force = false) {
  if (!soundchartsCredentialsConfigured()) return { status: "credentials_missing" as const, metrics: 0 };
  const db = getDb();
  const settings = (await db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID)).limit(1))[0];
  if (!settings) throw new Error("Configurações da Lander Records não foram inicializadas.");
  if (!force && isFresh(settings.soundchartsLastSyncedAt, SOUNDCHARTS_TTL_MS)) return { status: "fresh" as const, metrics: 0 };

  const links = [
    settings.instagramUrl ? { platform: "instagram", url: settings.instagramUrl } : null,
    settings.youtubeUrl ? { platform: "youtube", url: settings.youtubeUrl } : null,
  ].filter((item): item is { platform: string; url: string } => Boolean(item));
  if (!links.length) return { status: "not_configured" as const, metrics: 0 };

  try {
    let uuid = settings.soundchartsArtistUuid;
    let matchedVia = settings.soundchartsMatchedVia;
    const stillMatches = uuid && links.some((link) => {
      try { return matchedVia === `${link.platform}:${normalizeExternalUrl(link.url)}`; } catch { return false; }
    });
    if (!stillMatches) {
      const resolved = await resolveSoundchartsArtist(links);
      if (!resolved) {
        await db.update(landerRecordsIntegrationSettings).set({
          soundchartsArtistUuid: "",
          soundchartsResolutionStatus: "needs_review",
          soundchartsMatchedVia: "",
          soundchartsLastResolvedAt: new Date(),
          soundchartsLastError: "Nenhuma identidade de artista Soundcharts foi encontrada para as URLs oficiais informadas.",
          updatedAt: new Date(),
        }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
        return { status: "unresolved" as const, metrics: 0 };
      }
      uuid = resolved.uuid;
      matchedVia = `${resolved.matchedViaPlatform}:${resolved.matchedViaIdentifier}`;
      await db.update(landerRecordsIntegrationSettings).set({
        soundchartsArtistUuid: uuid,
        soundchartsResolutionStatus: "resolved",
        soundchartsMatchedVia: matchedVia,
        soundchartsLastResolvedAt: new Date(),
        soundchartsLastError: "",
        updatedAt: new Date(),
      }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    }

    const metrics = (await fetchSoundchartsArtistMetrics(uuid)).filter((metric) => metric.platform === "instagram" || metric.platform === "youtube");
    for (const metric of metrics) {
      await upsertCachedMetric({ entityType: "lander_records", entityId: LANDER_ENTITY_ID, ...metric });
    }
    await db.update(landerRecordsIntegrationSettings).set({
      soundchartsResolutionStatus: "resolved",
      soundchartsLastSyncedAt: new Date(),
      soundchartsLastError: "",
      updatedAt: new Date(),
    }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    return { status: "synced" as const, metrics: metrics.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Soundcharts.";
    await db.update(landerRecordsIntegrationSettings).set({ soundchartsLastError: message, updatedAt: new Date() }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    throw error;
  }
}

export async function syncArtistSoundcharts(artistId: string, force = false) {
  if (!soundchartsCredentialsConfigured()) return { status: "credentials_missing" as const, metrics: 0 };
  const db = getDb();
  const [identity, linkRows] = await Promise.all([
    db.select().from(artistExternalIdentities).where(eq(artistExternalIdentities.artistId, artistId)).limit(1).then((rows) => rows[0]),
    db.select({ platform: artistLinks.platform, url: artistLinks.url }).from(artistLinks).where(and(
      eq(artistLinks.artistId, artistId),
      eq(artistLinks.active, true),
      inArray(artistLinks.platform, ARTIST_PLATFORMS),
    )),
  ]);
  const links = linkRows.map((link) => ({ platform: link.platform.toLowerCase(), url: link.url })).filter((link) => link.url);
  if (!links.length) {
    await db.insert(artistExternalIdentities).values({ artistId, resolutionStatus: "unresolved", lastError: "Nenhuma URL de plataforma configurada." }).onConflictDoUpdate({
      target: artistExternalIdentities.artistId,
      set: { resolutionStatus: "unresolved", soundchartsArtistUuid: "", lastError: "Nenhuma URL de plataforma configurada.", updatedAt: new Date() },
    });
    return { status: "not_configured" as const, metrics: 0 };
  }
  if (!force && identity && isFresh(identity.lastSyncedAt, SOUNDCHARTS_TTL_MS) && resolutionStillMatches(identity, links)) return { status: "fresh" as const, metrics: 0 };

  try {
    let resolvedUuid = identity?.soundchartsArtistUuid || "";
    let matchedViaPlatform = identity?.matchedViaPlatform || "";
    let matchedViaIdentifier = identity?.matchedViaIdentifier || "";
    if (!resolutionStillMatches(identity, links)) {
      const resolved = await resolveSoundchartsArtist(links);
      if (!resolved) {
        await db.insert(artistExternalIdentities).values({
          artistId,
          resolutionStatus: "needs_review",
          lastResolvedAt: new Date(),
          lastError: "Nenhuma identidade Soundcharts determinística encontrada para as URLs cadastradas.",
        }).onConflictDoUpdate({
          target: artistExternalIdentities.artistId,
          set: {
            soundchartsArtistUuid: "",
            resolutionStatus: "needs_review",
            matchedViaPlatform: "",
            matchedViaIdentifier: "",
            lastResolvedAt: new Date(),
            lastError: "Nenhuma identidade Soundcharts determinística encontrada para as URLs cadastradas.",
            updatedAt: new Date(),
          },
        });
        return { status: "unresolved" as const, metrics: 0 };
      }
      resolvedUuid = resolved.uuid;
      matchedViaPlatform = resolved.matchedViaPlatform;
      matchedViaIdentifier = resolved.matchedViaIdentifier;
    }

    const metrics = await fetchSoundchartsArtistMetrics(resolvedUuid);
    await db.transaction(async (tx) => {
      await tx.insert(artistExternalIdentities).values({
        artistId,
        soundchartsArtistUuid: resolvedUuid,
        resolutionStatus: "resolved",
        matchedViaPlatform,
        matchedViaIdentifier,
        lastResolvedAt: new Date(),
        lastSyncedAt: new Date(),
        lastError: "",
      }).onConflictDoUpdate({
        target: artistExternalIdentities.artistId,
        set: {
          soundchartsArtistUuid: resolvedUuid,
          resolutionStatus: "resolved",
          matchedViaPlatform,
          matchedViaIdentifier,
          lastResolvedAt: new Date(),
          lastSyncedAt: new Date(),
          lastError: "",
          updatedAt: new Date(),
        },
      });
      for (const metric of metrics) {
        await tx.insert(artistMetrics).values({ artistId, platform: metric.platform, value: metric.value, source: "soundcharts", updatedAt: new Date() }).onConflictDoUpdate({
          target: [artistMetrics.artistId, artistMetrics.platform],
          set: { value: metric.value, source: "soundcharts", updatedAt: new Date() },
        });
        await tx.insert(integrationMetricCache).values({
          entityType: "artist",
          entityId: artistId,
          platform: metric.platform,
          metric: metric.metric,
          value: metric.value,
          source: "soundcharts",
          observedAt: metric.observedAt,
          fetchedAt: new Date(),
        }).onConflictDoUpdate({
          target: [integrationMetricCache.entityType, integrationMetricCache.entityId, integrationMetricCache.platform, integrationMetricCache.metric],
          set: { value: metric.value, source: "soundcharts", observedAt: metric.observedAt, fetchedAt: new Date() },
        });
      }
    });
    return { status: "synced" as const, metrics: metrics.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Soundcharts.";
    await db.insert(artistExternalIdentities).values({ artistId, resolutionStatus: identity?.resolutionStatus || "error", lastError: message }).onConflictDoUpdate({
      target: artistExternalIdentities.artistId,
      set: { lastError: message, updatedAt: new Date() },
    });
    throw error;
  }
}

export async function syncAllArtistSoundcharts(force = false) {
  const rows = await getDb().select({ id: artists.id }).from(artists).where(isNull(artists.archivedAt));
  const results: Array<{ artistId: string; status: string; metrics: number; error?: string }> = [];
  for (const artist of rows) {
    try {
      const result = await syncArtistSoundcharts(artist.id, force);
      results.push({ artistId: artist.id, status: result.status, metrics: result.metrics });
    } catch (error) {
      results.push({ artistId: artist.id, status: "error", metrics: 0, error: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  }
  return results;
}

export async function syncSpotifyReleases(force = false) {
  if (!spotifyCredentialsConfigured()) return { status: "credentials_missing" as const, releases: 0 };
  const db = getDb();
  const settings = (await db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID)).limit(1))[0];
  if (!settings?.spotifyPlaylistId) return { status: "not_configured" as const, releases: 0 };
  if (!settings.spotifyRefreshTokenEncrypted) return { status: "not_connected" as const, releases: 0 };
  if (!force && isFresh(settings.spotifyLastSyncedAt, SPOTIFY_TTL_MS)) return { status: "fresh" as const, releases: 0 };

  try {
    const result = await fetchLatestSpotifyPlaylistReleases(settings.spotifyPlaylistId);
    if (result.releases.length < 5) throw new Error(`A playlist retornou apenas ${result.releases.length} lançamentos distintos; são necessários pelo menos 5.`);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SPOTIFY_TTL_MS);
    await db.transaction(async (tx) => {
      await tx.delete(spotifyReleaseCache);
      await tx.insert(spotifyReleaseCache).values(result.releases.map((release, index) => ({
        position: index + 1,
        playlistId: settings.spotifyPlaylistId,
        albumId: release.albumId,
        title: release.title,
        artistName: release.artistName,
        coverUrl: release.coverUrl,
        spotifyUrl: release.spotifyUrl,
        releaseDate: release.releaseDate,
        releaseDatePrecision: release.releaseDatePrecision,
        playlistAddedAt: release.playlistAddedAt,
        fetchedAt: now,
        expiresAt,
      })));
      await tx.update(landerRecordsIntegrationSettings).set({
        spotifyPlaylistSnapshotId: result.snapshotId,
        spotifyLastSyncedAt: now,
        spotifyLastError: "",
        updatedAt: now,
      }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    });
    return { status: "synced" as const, releases: result.releases.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Spotify.";
    await db.update(landerRecordsIntegrationSettings).set({ spotifyLastError: message, updatedAt: new Date() }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    throw error;
  }
}

export async function syncAllIntegrations(force = false) {
  const spotify = await syncSpotifyReleases(force).catch((error) => ({ status: "error" as const, releases: 0, error: error instanceof Error ? error.message : "Erro desconhecido" }));
  const landerSoundcharts = await syncLanderRecordsSoundcharts(force).catch((error) => ({ status: "error" as const, metrics: 0, error: error instanceof Error ? error.message : "Erro desconhecido" }));
  const artistsSoundcharts = await syncAllArtistSoundcharts(force);
  return { spotify, landerSoundcharts, artistsSoundcharts };
}

export async function getLanderRecordsSocialMetrics() {
  const rows = await getDb().select().from(integrationMetricCache).where(and(
    eq(integrationMetricCache.entityType, "lander_records"),
    eq(integrationMetricCache.entityId, LANDER_ENTITY_ID),
    eq(integrationMetricCache.source, "soundcharts"),
  ));
  return Object.fromEntries(rows.map((row) => [`${row.platform}:${row.metric}`, row.value])) as Record<string, number>;
}

export async function getCachedSpotifyReleases() {
  const minimum = new Date(Date.now() - SPOTIFY_STALE_MAX_MS);
  return getDb().select().from(spotifyReleaseCache).where(gt(spotifyReleaseCache.fetchedAt, minimum)).orderBy(asc(spotifyReleaseCache.position));
}
