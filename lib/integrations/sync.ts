import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { artistMetricHistory, artistMetrics } from "../db/artist-management-schema";
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
import { mockDataEnabled, mockSocialMetrics, mockSpotifyFeed } from "../mocks";

const LANDER_ENTITY_ID = "lander_records";
const SOUNDCHARTS_TTL_MS = 24 * 60 * 60 * 1000;
const SPOTIFY_TTL_MS = 6 * 60 * 60 * 1000;
const SPOTIFY_STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const SPOTIFY_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const ARTIST_PLATFORMS = ["instagram", "spotify", "youtube", "tiktok", "soundcloud"];

function isFresh(date: Date | null, ttlMs: number) {
  return Boolean(date && date.getTime() > Date.now() - ttlMs);
}

async function upsertCachedMetric(executor: { insert: ReturnType<typeof getDb>["insert"] }, input: {
  entityType: string;
  entityId: string;
  platform: string;
  metric: string;
  value: number;
  observedAt: Date | null;
}) {
  await executor.insert(integrationMetricCache).values({
    ...input,
    source: "soundcharts",
    fetchedAt: new Date(),
  }).onConflictDoUpdate({
    target: [integrationMetricCache.entityType, integrationMetricCache.entityId, integrationMetricCache.platform, integrationMetricCache.metric],
    set: { value: input.value, source: "soundcharts", observedAt: input.observedAt, fetchedAt: new Date() },
  });
}

type Db = ReturnType<typeof getDb>;
export type DbExecutor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

// Metrics are only valid for the identity that produced them. When an identity is
// cleared or replaced, values observed for the previous Soundcharts artist must not
// stay published under this entity (ZERO != NULL != STALE != WRONG IDENTITY).
async function purgeArtistSoundchartsMetrics(executor: DbExecutor, artistId: string) {
  await executor.delete(artistMetrics).where(and(eq(artistMetrics.artistId, artistId), eq(artistMetrics.source, "soundcharts")));
  await executor.delete(integrationMetricCache).where(and(
    eq(integrationMetricCache.entityType, "artist"),
    eq(integrationMetricCache.entityId, artistId),
    eq(integrationMetricCache.source, "soundcharts"),
  ));
}

export async function purgeLanderRecordsSoundchartsMetrics(executor: DbExecutor) {
  await executor.delete(integrationMetricCache).where(and(
    eq(integrationMetricCache.entityType, "lander_records"),
    eq(integrationMetricCache.entityId, LANDER_ENTITY_ID),
    eq(integrationMetricCache.source, "soundcharts"),
  ));
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

// Every identity/metric write below is a compare-and-set under the settings row lock: it applies only if the official
// URLs (and, where relevant, the stored identity) are still the ones this run read. An admin save or another sync
// that changed them in the meantime wins; this run reports "superseded" instead of overwriting newer state.
/** Locks the Lander settings row. Admin saves take this lock before purging (same protocol as every sync write). */
export async function lockLanderSettings(tx: DbExecutor) {
  return (await tx.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID)).for("update"))[0];
}
const sameLanderUrls = (a: { instagramUrl: string; youtubeUrl: string } | undefined, b: { instagramUrl: string; youtubeUrl: string }) =>
  Boolean(a) && a!.instagramUrl === b.instagramUrl && a!.youtubeUrl === b.youtubeUrl;

export async function syncLanderRecordsSoundcharts(force = false) {
  const db = getDb();
  const settings = (await db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID)).limit(1))[0];
  if (!settings) throw new Error("Configurações da Lander Records não foram inicializadas.");
  // Identity validity is decided before the credentials/freshness short-circuits: withdrawing an invalidated
  // identity's metrics needs no provider call.

  const links = [
    settings.instagramUrl ? { platform: "instagram", url: settings.instagramUrl } : null,
    settings.youtubeUrl ? { platform: "youtube", url: settings.youtubeUrl } : null,
  ].filter((item): item is { platform: string; url: string } => Boolean(item));
  if (!links.length) {
    // No official URLs means no identity: always withdraw (idempotent), whatever state earlier writers left.
    const applied = await db.transaction(async (tx) => {
      if (!sameLanderUrls(await lockLanderSettings(tx), settings)) return false;
      await purgeLanderRecordsSoundchartsMetrics(tx);
      await tx.update(landerRecordsIntegrationSettings).set({
        soundchartsArtistUuid: "",
        soundchartsResolutionStatus: "unresolved",
        soundchartsMatchedVia: "",
        updatedAt: new Date(),
      }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
      return true;
    });
    return applied ? { status: "not_configured" as const, metrics: 0 } : { status: "superseded" as const, metrics: 0 };
  }

  let uuid = settings.soundchartsArtistUuid;
  let matchedVia = settings.soundchartsMatchedVia;
  const stillMatches = Boolean(uuid) && links.some((link) => {
    try { return matchedVia === `${link.platform}:${normalizeExternalUrl(link.url)}`; } catch { return false; }
  });
  if (!stillMatches) {
    // No valid identity for the current URLs: withdraw any stored identity and every cached metric now (also when
    // the identity was already cleared but metrics remain, e.g. rows committed by a sync that raced an admin save).
    const applied = await db.transaction(async (tx) => {
      const current = await lockLanderSettings(tx);
      if (!sameLanderUrls(current, settings) || current!.soundchartsArtistUuid !== uuid) return false;
      await purgeLanderRecordsSoundchartsMetrics(tx);
      if (uuid) {
        await tx.update(landerRecordsIntegrationSettings).set({
          soundchartsArtistUuid: "", soundchartsResolutionStatus: "unresolved", soundchartsMatchedVia: "", soundchartsLastSyncedAt: null, updatedAt: new Date(),
        }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
      }
      return true;
    });
    if (!applied) return { status: "superseded" as const, metrics: 0 };
    uuid = "";
    matchedVia = "";
  }
  if (!soundchartsCredentialsConfigured()) return { status: "credentials_missing" as const, metrics: 0 };
  if (!force && stillMatches && isFresh(settings.soundchartsLastSyncedAt, SOUNDCHARTS_TTL_MS)) return { status: "fresh" as const, metrics: 0 };

  try {
    const previousUuid = uuid;
    if (!stillMatches) {
      const resolved = await resolveSoundchartsArtist(links);
      if (!resolved) {
        const applied = await db.transaction(async (tx) => {
          const current = await lockLanderSettings(tx);
          if (!sameLanderUrls(current, settings) || current!.soundchartsArtistUuid !== previousUuid) return false;
          await purgeLanderRecordsSoundchartsMetrics(tx);
          await tx.update(landerRecordsIntegrationSettings).set({
            soundchartsArtistUuid: "",
            soundchartsResolutionStatus: "needs_review",
            soundchartsMatchedVia: "",
            soundchartsLastResolvedAt: new Date(),
            soundchartsLastError: "Nenhuma identidade de artista Soundcharts foi encontrada para as URLs oficiais informadas.",
            updatedAt: new Date(),
          }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
          return true;
        });
        return applied ? { status: "unresolved" as const, metrics: 0 } : { status: "superseded" as const, metrics: 0 };
      }
      uuid = resolved.uuid;
      matchedVia = `${resolved.matchedViaPlatform}:${resolved.matchedViaIdentifier}`;
      // Re-point the identity and withdraw the previous identity's metrics atomically, before fetching:
      // a failed fetch must leave "no data", never the old identity's values under the new one.
      const identityChanged = uuid !== previousUuid;
      const applied = await db.transaction(async (tx) => {
        // Only for the URLs this resolution used, and only over the identity this run started from.
        const current = await lockLanderSettings(tx);
        if (!sameLanderUrls(current, settings) || current!.soundchartsArtistUuid !== previousUuid) return false;
        if (identityChanged) await purgeLanderRecordsSoundchartsMetrics(tx);
        await tx.update(landerRecordsIntegrationSettings).set({
          soundchartsArtistUuid: uuid,
          soundchartsResolutionStatus: "resolved",
          soundchartsMatchedVia: matchedVia,
          soundchartsLastResolvedAt: new Date(),
          ...(identityChanged ? { soundchartsLastSyncedAt: null } : {}),
          soundchartsLastError: "",
          updatedAt: new Date(),
        }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
        return true;
      });
      if (!applied) return { status: "superseded" as const, metrics: 0 };
    }

    const metrics = (await fetchSoundchartsArtistMetrics(uuid)).filter((metric) => metric.platform === "instagram" || metric.platform === "youtube");
    // Publish only if the identity is still the one we fetched for: a concurrent admin save or forced sync may
    // have re-pointed it while the fetch was in flight (row lock serializes with those writers).
    const published = await db.transaction(async (tx) => {
      const current = await lockLanderSettings(tx);
      if (!sameLanderUrls(current, settings) || current!.soundchartsArtistUuid !== uuid) return false;
      for (const metric of metrics) {
        await upsertCachedMetric(tx, { entityType: "lander_records", entityId: LANDER_ENTITY_ID, ...metric });
      }
      await tx.update(landerRecordsIntegrationSettings).set({
        soundchartsResolutionStatus: "resolved",
        soundchartsLastSyncedAt: new Date(),
        soundchartsLastError: "",
        updatedAt: new Date(),
      }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
      return true;
    });
    if (!published) return { status: "superseded" as const, metrics: 0 };
    return { status: "synced" as const, metrics: metrics.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Soundcharts.";
    // The error describes this run's identity: record it only while that identity is still current.
    await db.transaction(async (tx) => {
      const current = await lockLanderSettings(tx);
      if (!sameLanderUrls(current, settings) || current!.soundchartsArtistUuid !== uuid) return;
      await tx.update(landerRecordsIntegrationSettings).set({ soundchartsLastError: message, updatedAt: new Date() }).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID));
    });
    throw error;
  }
}

async function readArtistLinks(executor: DbExecutor, artistId: string) {
  const rows = await executor.select({ platform: artistLinks.platform, url: artistLinks.url }).from(artistLinks).where(and(
    eq(artistLinks.artistId, artistId),
    eq(artistLinks.active, true),
    inArray(artistLinks.platform, ARTIST_PLATFORMS),
  ));
  return rows.map((link) => ({ platform: link.platform.toLowerCase(), url: link.url })).filter((link) => link.url);
}
const linksKey = (links: Array<{ platform: string; url: string }>) => links.map((l) => `${l.platform}|${l.url}`).sort().join("\n");

// Same compare-and-set rule as the Lander path: the identity row is locked (the admin save locks it too) and a
// write applies only while the artist's links and stored identity are still the ones this run read.
/**
 * Locks an artist's identity row, creating it first so there is always a row to lock (a missing row would let two
 * writers interleave). Admin saves take this lock before purging (same protocol as every sync write).
 */
export async function lockArtistIdentityRow(tx: DbExecutor, artistId: string) {
  await tx.insert(artistExternalIdentities).values({ artistId, resolutionStatus: "unresolved" }).onConflictDoNothing();
  return (await tx.select().from(artistExternalIdentities).where(eq(artistExternalIdentities.artistId, artistId)).for("update"))[0];
}

async function lockArtistIdentity(tx: DbExecutor, artistId: string, links: Array<{ platform: string; url: string }>, expectedUuid: string) {
  const current = await lockArtistIdentityRow(tx, artistId);
  if ((current?.soundchartsArtistUuid || "") !== expectedUuid) return false;
  return linksKey(await readArtistLinks(tx, artistId)) === linksKey(links);
}

export async function syncArtistSoundcharts(artistId: string, force = false) {
  const db = getDb();
  const [identity, links] = await Promise.all([
    db.select().from(artistExternalIdentities).where(eq(artistExternalIdentities.artistId, artistId)).limit(1).then((rows) => rows[0]),
    readArtistLinks(db, artistId),
  ]);
  const startUuid = identity?.soundchartsArtistUuid || "";
  if (!links.length) {
    const applied = await db.transaction(async (tx) => {
      if (!(await lockArtistIdentity(tx, artistId, links, startUuid))) return false;
      await purgeArtistSoundchartsMetrics(tx, artistId);
      await tx.insert(artistExternalIdentities).values({ artistId, resolutionStatus: "unresolved", lastError: "Nenhuma URL de plataforma configurada." }).onConflictDoUpdate({
        target: artistExternalIdentities.artistId,
        set: { resolutionStatus: "unresolved", soundchartsArtistUuid: "", matchedViaPlatform: "", matchedViaIdentifier: "", lastError: "Nenhuma URL de plataforma configurada.", updatedAt: new Date() },
      });
      return true;
    });
    return applied ? { status: "not_configured" as const, metrics: 0 } : { status: "superseded" as const, metrics: 0 };
  }
  if (!resolutionStillMatches(identity, links)) {
    // No valid identity for the current links: withdraw any stored identity and every Soundcharts metric before
    // anything that needs the provider (also when the identity was already cleared but metrics remain).
    const applied = await db.transaction(async (tx) => {
      if (!(await lockArtistIdentity(tx, artistId, links, startUuid))) return false;
      await purgeArtistSoundchartsMetrics(tx, artistId);
      if (startUuid) await tx.update(artistExternalIdentities).set({ soundchartsArtistUuid: "", resolutionStatus: "unresolved", matchedViaPlatform: "", matchedViaIdentifier: "", lastSyncedAt: null, updatedAt: new Date() }).where(eq(artistExternalIdentities.artistId, artistId));
      return true;
    });
    if (!applied) return { status: "superseded" as const, metrics: 0 };
    if (identity) { identity.soundchartsArtistUuid = ""; identity.resolutionStatus = "unresolved"; }
  }
  if (!soundchartsCredentialsConfigured()) return { status: "credentials_missing" as const, metrics: 0 };
  if (!force && identity && isFresh(identity.lastSyncedAt, SOUNDCHARTS_TTL_MS) && resolutionStillMatches(identity, links)) return { status: "fresh" as const, metrics: 0 };

  let runUuid = identity?.soundchartsArtistUuid || ""; // the identity this run currently stands on
  try {
    let resolvedUuid = identity?.soundchartsArtistUuid || "";
    let matchedViaPlatform = identity?.matchedViaPlatform || "";
    let matchedViaIdentifier = identity?.matchedViaIdentifier || "";
    if (!resolutionStillMatches(identity, links)) {
      const resolved = await resolveSoundchartsArtist(links);
      if (!resolved) {
        const applied = await db.transaction(async (tx) => {
          if (!(await lockArtistIdentity(tx, artistId, links, ""))) return false;
          await purgeArtistSoundchartsMetrics(tx, artistId);
          await tx.insert(artistExternalIdentities).values({
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
          return true;
        });
        return applied ? { status: "unresolved" as const, metrics: 0 } : { status: "superseded" as const, metrics: 0 };
      }
      resolvedUuid = resolved.uuid;
      matchedViaPlatform = resolved.matchedViaPlatform;
      matchedViaIdentifier = resolved.matchedViaIdentifier;
      // Links no longer match the stored identity. If the resolved identity differs, persist it and withdraw
      // the previous identity's metrics atomically before fetching, so a failed fetch leaves "no data".
      // Only for the links this resolution used, and only over the (cleared) identity this run left.
      if (resolvedUuid !== (identity?.soundchartsArtistUuid || "")) {
        const applied = await db.transaction(async (tx) => {
          if (!(await lockArtistIdentity(tx, artistId, links, identity?.soundchartsArtistUuid || ""))) return false;
          await purgeArtistSoundchartsMetrics(tx, artistId);
          await tx.insert(artistExternalIdentities).values({
            artistId, soundchartsArtistUuid: resolvedUuid, resolutionStatus: "resolved", matchedViaPlatform, matchedViaIdentifier, lastResolvedAt: new Date(), lastSyncedAt: null, lastError: "",
          }).onConflictDoUpdate({
            target: artistExternalIdentities.artistId,
            set: { soundchartsArtistUuid: resolvedUuid, resolutionStatus: "resolved", matchedViaPlatform, matchedViaIdentifier, lastResolvedAt: new Date(), lastSyncedAt: null, lastError: "", updatedAt: new Date() },
          });
          return true;
        });
        if (!applied) return { status: "superseded" as const, metrics: 0 };
      }
      runUuid = resolvedUuid;
    }

    const metrics = await fetchSoundchartsArtistMetrics(resolvedUuid);
    const identityChanged = resolvedUuid !== (identity?.soundchartsArtistUuid || "");
    const published = await db.transaction(async (tx) => {
      // Same guard as the Lander path: never publish values fetched for an identity that was replaced meanwhile.
      if (!resolvedUuid || !(await lockArtistIdentity(tx, artistId, links, resolvedUuid))) return false;
      if (identityChanged) await purgeArtistSoundchartsMetrics(tx, artistId);
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
        const recordedAt = new Date();
        await tx.insert(artistMetricHistory).values({
          artistId,
          platform: metric.platform,
          value: metric.value,
          source: "soundcharts",
          observedAt: metric.observedAt,
          recordedAt,
        });
        await tx.insert(artistMetrics).values({ artistId, platform: metric.platform, value: metric.value, source: "soundcharts", updatedAt: recordedAt }).onConflictDoUpdate({
          target: [artistMetrics.artistId, artistMetrics.platform, artistMetrics.source],
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
      return true;
    });
    if (!published) return { status: "superseded" as const, metrics: 0 };
    return { status: "synced" as const, metrics: metrics.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Soundcharts.";
    // Same rule as the Lander path: a superseded run never stamps its error on a newer identity.
    await db.transaction(async (tx) => {
      if (!(await lockArtistIdentity(tx, artistId, links, runUuid))) return;
      await tx.update(artistExternalIdentities).set({ lastError: message, updatedAt: new Date() }).where(eq(artistExternalIdentities.artistId, artistId));
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SPOTIFY_TTL_MS);
    await db.transaction(async (tx) => {
      await tx.delete(spotifyReleaseCache);
      if (result.releases.length) {
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
      }
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
  if (mockDataEnabled()) return mockSocialMetrics;
  const rows = await getDb().select().from(integrationMetricCache).where(and(
    eq(integrationMetricCache.entityType, "lander_records"),
    eq(integrationMetricCache.entityId, LANDER_ENTITY_ID),
    eq(integrationMetricCache.source, "soundcharts"),
  ));
  return Object.fromEntries(rows.map((row) => [`${row.platform}:${row.metric}`, row.value])) as Record<string, number>;
}

export async function getCachedSpotifyReleases(playlistId?: string) {
  if (mockDataEnabled()) return mockSpotifyFeed.releases;
  const minimum = new Date(Date.now() - SPOTIFY_STALE_MAX_MS);
  const where = playlistId
    ? and(gt(spotifyReleaseCache.fetchedAt, minimum), eq(spotifyReleaseCache.playlistId, playlistId))
    : gt(spotifyReleaseCache.fetchedAt, minimum);
  return getDb().select().from(spotifyReleaseCache).where(where).orderBy(asc(spotifyReleaseCache.position)).limit(5);
}

export async function getHomeSpotifyReleaseFeed() {
  if (mockDataEnabled()) return mockSpotifyFeed;
  const db = getDb();
  const settings = (await db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, LANDER_ENTITY_ID)).limit(1))[0];
  if (!settings?.spotifyPlaylistId || !settings.spotifyPlaylistUrl) return { playlistUrl: "", releases: [] };

  let releases = await getCachedSpotifyReleases(settings.spotifyPlaylistId);
  const refreshDue = !isFresh(settings.spotifyLastSyncedAt, SPOTIFY_TTL_MS);
  const retryAllowed = !settings.spotifyLastError || settings.updatedAt.getTime() <= Date.now() - SPOTIFY_RETRY_COOLDOWN_MS;
  if (refreshDue && retryAllowed && spotifyCredentialsConfigured() && settings.spotifyRefreshTokenEncrypted) {
    try {
      await syncSpotifyReleases(false);
      releases = await getCachedSpotifyReleases(settings.spotifyPlaylistId);
    } catch (error) {
      console.error("[spotify-home] Falha ao atualizar automaticamente os Últimos Lançamentos.", error instanceof Error ? error.message : error);
    }
  }

  return { playlistUrl: settings.spotifyPlaylistUrl, releases: releases.slice(0, 5) };
}
