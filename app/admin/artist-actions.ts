"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { audit, requirePersistentAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { trustedEmbedUrl } from "../../lib/media-embed";
import { deleteMedia as deleteStoredMedia, uploadMedia as uploadStoredMedia } from "@/lib/storage";
import {
  artistGenreRelations,
  artistMetrics,
  artistProfiles,
  artistPublicationDestinations,
  artistPublicationPlacements,
  artistRoleRelations,
} from "../../lib/db/artist-management-schema";
import { artistExternalIdentities, integrationMetricCache } from "../../lib/db/integration-schema";
import {
  artistCategoryRelations,
  artistEmbeds,
  artistLinks,
  artists,
  mediaAssets,
  slugRedirects,
} from "../../lib/db/schema";
import { normalizePlatformUrl } from "../../lib/integrations/identity";
import { lockArtistIdentityRow, syncArtistSoundcharts } from "../../lib/integrations/sync";
import { slugify } from "../../lib/slug";

export type ArtistActionState = { ok: boolean; error?: string };

const socialPlatforms = ["facebook", "instagram", "spotify", "youtube", "tiktok", "soundcloud"] as const;
const soundchartsPlatforms = ["instagram", "spotify", "youtube", "tiktok", "soundcloud"] as const;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function integer(formData: FormData, name: string) {
  const value = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(value) ? value : 0;
}

function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function uuidList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).map(uuidOrNull).filter((value): value is string => Boolean(value));
}

function httpUrlOrEmpty(value: string, label: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password || !url.hostname) throw new Error("invalid URL");
    url.hash = "";
    return url.toString();
  } catch {
    throw new Error(`${label} precisa ser uma URL HTTP(S) válida.`);
  }
}

function revalidateArtistContent(slugs: string[]) {
  for (const path of ["/", "/artistas", "/sitemap.xml", "/admin", "/admin/artists"]) revalidatePath(path);
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/artistas/${slug}`);
}

function platformLabel(platform: string) {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    spotify: "Spotify",
    youtube: "YouTube",
    tiktok: "TikTok",
    soundcloud: "SoundCloud",
  };
  return labels[platform] || platform;
}

async function prepareArtistImage(formData: FormData, fieldName: string, slug: string, kind: "card" | "hero") {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("A imagem enviada precisa ser um arquivo de imagem válido.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("A imagem enviada excede o limite de 12 MB.");
  const source = Buffer.from(await file.arrayBuffer());
  const output = await sharp(source).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  const key = `media/artists/${slug}/${kind}-${crypto.randomUUID()}.webp`;
  const stored = await uploadStoredMedia(key, output.data, "image/webp");
  return {
    storageProvider: "supabase_storage" as const,
    storageKey: stored.key,
    url: stored.url,
    mimeType: "image/webp",
    byteSize: output.info.size,
    width: output.info.width,
    height: output.info.height,
    originalFilename: file.name,
  };
}

async function cleanupPreparedUploads(...uploads: Array<Awaited<ReturnType<typeof prepareArtistImage>>>) {
  await Promise.allSettled(uploads.filter((upload): upload is NonNullable<typeof upload> => Boolean(upload)).map((upload) => deleteStoredMedia(upload.storageKey)));
}

export async function saveArtistAction(_: ArtistActionState, formData: FormData): Promise<ArtistActionState> {
  const session = await requirePersistentAdmin("editor");
  const id = uuidOrNull(text(formData, "id"));
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const status = text(formData, "status") || "draft";
  const returnTo = text(formData, "returnTo");

  if (!name || !slug) return { ok: false, error: "Nome e slug são obrigatórios." };
  if (!["published", "draft", "inactive"].includes(status)) return { ok: false, error: "Status inválido." };

  const categoryIds = uuidList(formData, "categoryIds");
  const roleIds = uuidList(formData, "roleIds");
  const genreIds = uuidList(formData, "genreIds");
  const destinationIds = uuidList(formData, "destinationIds");
  if (!roleIds.length) return { ok: false, error: "Selecione ao menos uma função do artista." };
  if (!genreIds.length) return { ok: false, error: "Selecione ao menos um gênero musical." };

  let canonicalUrl = "";
  let normalizedLinks: Array<{ platform: typeof socialPlatforms[number]; url: string; position: number }>;
  try {
    canonicalUrl = httpUrlOrEmpty(text(formData, "canonicalUrl"), "A URL canônica");
    normalizedLinks = socialPlatforms
      .map((platform, position) => ({ platform, url: text(formData, `link_${platform}`), position }))
      .filter((item) => item.url)
      .map((item) => ({ ...item, url: normalizePlatformUrl(item.platform, item.url) }));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Uma URL de plataforma é inválida." };
  }

  const youtubeVideo = text(formData, "youtubeVideo");
  const spotifyEmbed = text(formData, "spotifyEmbed");
  if (youtubeVideo && !trustedEmbedUrl("youtube", youtubeVideo)) return { ok: false, error: "URL do vídeo do YouTube inválida." };
  if (spotifyEmbed && !trustedEmbedUrl("spotify", spotifyEmbed)) return { ok: false, error: "URL ou embed do Spotify inválido." };

  let cardUpload: Awaited<ReturnType<typeof prepareArtistImage>> = null;
  let heroUpload: Awaited<ReturnType<typeof prepareArtistImage>> = null;
  try {
    cardUpload = await prepareArtistImage(formData, "cardMediaUpload", slug, "card");
    heroUpload = await prepareArtistImage(formData, "heroMediaUpload", slug, "hero");
  } catch (error) {
    await cleanupPreparedUploads(cardUpload, heroUpload);
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao processar as imagens do artista." };
  }

  const db = getDb();
  let artistId = id || "";
  let previousSlug = "";
  const previousLinks = id
    ? await db.select({ platform: artistLinks.platform, url: artistLinks.url }).from(artistLinks).where(and(eq(artistLinks.artistId, id), eq(artistLinks.active, true)))
    : [];
  const previousSoundchartsLinks = new Map(previousLinks
    .filter((item) => soundchartsPlatforms.includes(item.platform.toLowerCase() as typeof soundchartsPlatforms[number]))
    .map((item) => [item.platform.toLowerCase(), item.url]));
  const nextSoundchartsLinks = new Map(normalizedLinks
    .filter((item) => soundchartsPlatforms.includes(item.platform as typeof soundchartsPlatforms[number]))
    .map((item) => [item.platform, item.url]));
  const soundchartsLinksChanged = !id || soundchartsPlatforms.some((platform) => (previousSoundchartsLinks.get(platform) || "") !== (nextSoundchartsLinks.get(platform) || ""));

  try {
    artistId = await db.transaction(async (tx) => {
      let cardMediaId = uuidOrNull(text(formData, "cardMediaId"));
      let heroMediaId = uuidOrNull(text(formData, "heroMediaId"));
      if (cardUpload) {
        const rows = await tx.insert(mediaAssets).values({ ...cardUpload, altText: `${name} — imagem principal`, status: "active", createdBy: session.user.id, updatedBy: session.user.id }).returning({ id: mediaAssets.id });
        cardMediaId = rows[0].id;
      }
      if (heroUpload) {
        const rows = await tx.insert(mediaAssets).values({ ...heroUpload, altText: `${name} — banner`, status: "active", createdBy: session.user.id, updatedBy: session.user.id }).returning({ id: mediaAssets.id });
        heroMediaId = rows[0].id;
      }

      let resolvedId = id;
      if (resolvedId) {
        const current = (await tx.select().from(artists).where(eq(artists.id, resolvedId)).limit(1))[0];
        if (!current) throw new Error("Artista não encontrado.");
        previousSlug = current.slug;
        await tx.update(artists).set({
          name, slug, shortBio: text(formData, "shortBio"), biography: text(formData, "biography"), cardMediaId, heroMediaId,
          ogMediaId: uuidOrNull(text(formData, "ogMediaId")), isPublished: status === "published",
          publishedAt: status === "published" ? (current.publishedAt || new Date()) : null, featureOnHome: false,
          homePosition: integer(formData, "homePosition"), listPosition: integer(formData, "listPosition"),
          seoTitle: text(formData, "seoTitle"), seoDescription: text(formData, "seoDescription"), canonicalUrl,
          updatedBy: session.user.id, updatedAt: new Date(),
        }).where(eq(artists.id, resolvedId));
      } else {
        const inserted = await tx.insert(artists).values({
          name, slug, shortBio: text(formData, "shortBio"), biography: text(formData, "biography"), cardMediaId, heroMediaId,
          ogMediaId: uuidOrNull(text(formData, "ogMediaId")), isPublished: status === "published", publishedAt: status === "published" ? new Date() : null,
          featureOnHome: false, homePosition: integer(formData, "homePosition"), listPosition: integer(formData, "listPosition"),
          seoTitle: text(formData, "seoTitle"), seoDescription: text(formData, "seoDescription"), canonicalUrl,
          createdBy: session.user.id, updatedBy: session.user.id,
        }).returning({ id: artists.id });
        resolvedId = inserted[0].id;
      }

      if (previousSlug && previousSlug !== slug) {
        await tx.insert(slugRedirects).values({ entityType: "artist", oldSlug: previousSlug, newSlug: slug }).onConflictDoUpdate({ target: [slugRedirects.entityType, slugRedirects.oldSlug], set: { newSlug: slug } });
      }

      await tx.insert(artistProfiles).values({
        artistId: resolvedId, isActive: status !== "inactive", pageLink: `/artistas/${slug}`,
        hireTitle: text(formData, "hireTitle") || "Contrate", hireText: text(formData, "hireText"), hireButtonLabel: text(formData, "hireButtonLabel") || "Quero contratar", updatedAt: new Date(),
      }).onConflictDoUpdate({ target: artistProfiles.artistId, set: {
        isActive: status !== "inactive", pageLink: `/artistas/${slug}`,
        hireTitle: text(formData, "hireTitle") || "Contrate", hireText: text(formData, "hireText"), hireButtonLabel: text(formData, "hireButtonLabel") || "Quero contratar", updatedAt: new Date(),
      }});

      await tx.delete(artistCategoryRelations).where(eq(artistCategoryRelations.artistId, resolvedId));
      if (categoryIds.length) await tx.insert(artistCategoryRelations).values(categoryIds.map((categoryId, index) => ({ artistId: resolvedId!, categoryId, isPrimary: index === 0, position: index })));
      await tx.delete(artistRoleRelations).where(eq(artistRoleRelations.artistId, resolvedId));
      await tx.insert(artistRoleRelations).values(roleIds.map((roleId, index) => ({ artistId: resolvedId!, roleId, position: index })));
      await tx.delete(artistGenreRelations).where(eq(artistGenreRelations.artistId, resolvedId));
      await tx.insert(artistGenreRelations).values(genreIds.map((genreId, index) => ({ artistId: resolvedId!, genreId, position: index })));

      const recognizedLinkNames = socialPlatforms.flatMap((platform) => [platform, platformLabel(platform)]);
      await tx.delete(artistLinks).where(and(eq(artistLinks.artistId, resolvedId), inArray(artistLinks.platform, recognizedLinkNames)));
      if (normalizedLinks.length) await tx.insert(artistLinks).values(normalizedLinks.map((item) => ({
        artistId: resolvedId!, kind: item.platform === "spotify" || item.platform === "youtube" || item.platform === "soundcloud" ? "platform" : "social",
        platform: item.platform, label: platformLabel(item.platform), url: item.url, position: item.position, active: true,
      })));

      if (soundchartsLinksChanged) {
        // Lock the identity row first: an in-flight sync publish holds the same lock, so the purge below runs
        // after it commits (and the publish, seeing the changed links, is superseded) — never beside it.
        await lockArtistIdentityRow(tx, resolvedId);
        await tx.delete(artistMetrics).where(eq(artistMetrics.artistId, resolvedId));
        await tx.delete(integrationMetricCache).where(and(eq(integrationMetricCache.entityType, "artist"), eq(integrationMetricCache.entityId, resolvedId)));
        await tx.insert(artistExternalIdentities).values({ artistId: resolvedId, resolutionStatus: "unresolved", soundchartsArtistUuid: "", matchedViaPlatform: "", matchedViaIdentifier: "", lastError: "", updatedAt: new Date() }).onConflictDoUpdate({
          target: artistExternalIdentities.artistId,
          set: { resolutionStatus: "unresolved", soundchartsArtistUuid: "", matchedViaPlatform: "", matchedViaIdentifier: "", lastResolvedAt: null, lastSyncedAt: null, lastError: "", updatedAt: new Date() },
        });
      }

      await tx.delete(artistEmbeds).where(and(eq(artistEmbeds.artistId, resolvedId), inArray(artistEmbeds.type, ["youtube", "spotify"])));
      if (youtubeVideo) await tx.insert(artistEmbeds).values({ artistId: resolvedId, type: "youtube", title: `Vídeo de ${name}`, url: youtubeVideo, position: 0, active: true, featured: true });
      if (spotifyEmbed) await tx.insert(artistEmbeds).values({ artistId: resolvedId, type: "spotify", title: `Spotify de ${name}`, url: spotifyEmbed, position: 1, active: true, featured: true });

      await tx.delete(artistPublicationPlacements).where(eq(artistPublicationPlacements.artistId, resolvedId));
      if (destinationIds.length) {
        const validDestinations = await tx.select({ id: artistPublicationDestinations.id, key: artistPublicationDestinations.key }).from(artistPublicationDestinations).where(and(inArray(artistPublicationDestinations.id, destinationIds), eq(artistPublicationDestinations.active, true)));
        await tx.insert(artistPublicationPlacements).values(validDestinations.map((destination) => ({
          artistId: resolvedId!, destinationId: destination.id, enabled: true,
          position: destination.key === "home_artists" ? integer(formData, "homePosition") : integer(formData, "listPosition"), updatedAt: new Date(),
        })));
        await tx.update(artists).set({ featureOnHome: validDestinations.some((item) => item.key === "home_artists") }).where(eq(artists.id, resolvedId));
      }
      return resolvedId;
    });
  } catch (error) {
    await cleanupPreparedUploads(cardUpload, heroUpload);
    const message = error instanceof Error ? error.message : "Falha ao salvar artista.";
    if (/duplicate key|unique/i.test(message)) return { ok: false, error: "Já existe um artista com esse slug." };
    return { ok: false, error: message };
  }

  await audit(session.user.id, id ? "artist.updated" : "artist.created", "artist", artistId, { name, slug, status, destinations: destinationIds.length, soundchartsIdentityInvalidated: soundchartsLinksChanged });
  await syncArtistSoundcharts(artistId, soundchartsLinksChanged).catch(() => null);
  revalidateArtistContent([previousSlug, slug]);
  redirect(returnTo === "/admin/artists?saved=1" ? returnTo : `/admin/artists/${artistId}?saved=1`);
}

export async function deleteArtistAction(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = uuidOrNull(text(formData, "id"));
  if (!id) throw new Error("Artista inválido.");
  const db = getDb();
  const current = (await db.select({ slug: artists.slug, name: artists.name }).from(artists).where(eq(artists.id, id)).limit(1))[0];
  if (!current) throw new Error("Artista não encontrado.");
  await db.transaction(async (tx) => {
    await tx.delete(integrationMetricCache).where(and(eq(integrationMetricCache.entityType, "artist"), eq(integrationMetricCache.entityId, id)));
    await tx.delete(artists).where(eq(artists.id, id));
  });
  await audit(session.user.id, "artist.deleted", "artist", id, { name: current.name, slug: current.slug });
  revalidateArtistContent([current.slug]);
  redirect("/admin/artists?deleted=1");
}
