"use server";

import { put } from "@vercel/blob";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { audit, requireAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import {
  artistGenreRelations,
  artistMetrics,
  artistProfiles,
  artistPublicationDestinations,
  artistPublicationPlacements,
  artistRoleRelations,
} from "../../lib/db/artist-management-schema";
import {
  artistCategoryRelations,
  artistEmbeds,
  artistLinks,
  artists,
  mediaAssets,
  slugRedirects,
} from "../../lib/db/schema";
import { slugify } from "../../lib/slug";

export type ArtistActionState = { ok: boolean; error?: string };

const metricPlatforms = ["instagram", "youtube", "tiktok", "soundcloud", "spotify"] as const;
const socialPlatforms = ["facebook", "instagram", "spotify", "youtube", "tiktok", "soundcloud"] as const;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function integer(formData: FormData, name: string) {
  const value = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(value) ? value : 0;
}

function metric(formData: FormData, name: string) {
  const raw = text(formData, name).replace(/[^0-9]/g, "");
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Métrica inválida: ${name}.`);
  return value;
}

function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function uuidList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).map(uuidOrNull).filter((value): value is string => Boolean(value));
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("O armazenamento de mídia não está configurado para uploads.");

  const source = Buffer.from(await file.arrayBuffer());
  const output = await sharp(source).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  const key = `media/artists/${slug}/${kind}-${crypto.randomUUID()}.webp`;
  const blob = await put(key, output.data, { access: "public", addRandomSuffix: false, contentType: "image/webp" });
  return {
    storageProvider: "vercel_blob" as const,
    storageKey: key,
    url: blob.url,
    mimeType: "image/webp",
    byteSize: output.info.size,
    width: output.info.width,
    height: output.info.height,
    originalFilename: file.name,
  };
}

export async function saveArtistAction(_: ArtistActionState, formData: FormData): Promise<ArtistActionState> {
  const session = await requireAdmin("editor");
  const id = uuidOrNull(text(formData, "id"));
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const status = text(formData, "status") || "draft";

  if (!name || !slug) return { ok: false, error: "Nome e slug são obrigatórios." };
  if (!["published", "draft", "inactive"].includes(status)) return { ok: false, error: "Status inválido." };

  const categoryIds = uuidList(formData, "categoryIds");
  const roleIds = uuidList(formData, "roleIds");
  const genreIds = uuidList(formData, "genreIds");
  const destinationIds = uuidList(formData, "destinationIds");
  if (!roleIds.length) return { ok: false, error: "Selecione ao menos uma função do artista." };
  if (!genreIds.length) return { ok: false, error: "Selecione ao menos um gênero musical." };

  let cardUpload: Awaited<ReturnType<typeof prepareArtistImage>> = null;
  let heroUpload: Awaited<ReturnType<typeof prepareArtistImage>> = null;
  try {
    [cardUpload, heroUpload] = await Promise.all([
      prepareArtistImage(formData, "cardMediaUpload", slug, "card"),
      prepareArtistImage(formData, "heroMediaUpload", slug, "hero"),
    ]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao processar as imagens do artista." };
  }

  const db = getDb();
  let artistId = id || "";
  let previousSlug = "";

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
          name,
          slug,
          shortBio: text(formData, "shortBio"),
          biography: text(formData, "biography"),
          cardMediaId,
          heroMediaId,
          ogMediaId: uuidOrNull(text(formData, "ogMediaId")),
          isPublished: status === "published",
          publishedAt: status === "published" ? (current.publishedAt || new Date()) : null,
          featureOnHome: false,
          homePosition: integer(formData, "homePosition"),
          listPosition: integer(formData, "listPosition"),
          seoTitle: text(formData, "seoTitle"),
          seoDescription: text(formData, "seoDescription"),
          canonicalUrl: text(formData, "canonicalUrl"),
          updatedBy: session.user.id,
          updatedAt: new Date(),
        }).where(eq(artists.id, resolvedId));
      } else {
        const inserted = await tx.insert(artists).values({
          name,
          slug,
          shortBio: text(formData, "shortBio"),
          biography: text(formData, "biography"),
          cardMediaId,
          heroMediaId,
          ogMediaId: uuidOrNull(text(formData, "ogMediaId")),
          isPublished: status === "published",
          publishedAt: status === "published" ? new Date() : null,
          featureOnHome: false,
          homePosition: integer(formData, "homePosition"),
          listPosition: integer(formData, "listPosition"),
          seoTitle: text(formData, "seoTitle"),
          seoDescription: text(formData, "seoDescription"),
          canonicalUrl: text(formData, "canonicalUrl"),
          createdBy: session.user.id,
          updatedBy: session.user.id,
        }).returning({ id: artists.id });
        resolvedId = inserted[0].id;
      }

      if (previousSlug && previousSlug !== slug) {
        await tx.insert(slugRedirects).values({ entityType: "artist", oldSlug: previousSlug, newSlug: slug }).onConflictDoUpdate({
          target: [slugRedirects.entityType, slugRedirects.oldSlug],
          set: { newSlug: slug },
        });
      }

      await tx.insert(artistProfiles).values({
        artistId: resolvedId,
        isActive: status !== "inactive",
        pageLink: text(formData, "pageLink") || `/artistas/${slug}`,
        hireTitle: text(formData, "hireTitle") || "Contrate",
        hireText: text(formData, "hireText"),
        hireButtonLabel: text(formData, "hireButtonLabel") || "Quero contratar",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: artistProfiles.artistId,
        set: {
          isActive: status !== "inactive",
          pageLink: text(formData, "pageLink") || `/artistas/${slug}`,
          hireTitle: text(formData, "hireTitle") || "Contrate",
          hireText: text(formData, "hireText"),
          hireButtonLabel: text(formData, "hireButtonLabel") || "Quero contratar",
          updatedAt: new Date(),
        },
      });

      await tx.delete(artistCategoryRelations).where(eq(artistCategoryRelations.artistId, resolvedId));
      if (categoryIds.length) await tx.insert(artistCategoryRelations).values(categoryIds.map((categoryId, index) => ({ artistId: resolvedId!, categoryId, isPrimary: index === 0, position: index })));

      await tx.delete(artistRoleRelations).where(eq(artistRoleRelations.artistId, resolvedId));
      await tx.insert(artistRoleRelations).values(roleIds.map((roleId, index) => ({ artistId: resolvedId!, roleId, position: index })));

      await tx.delete(artistGenreRelations).where(eq(artistGenreRelations.artistId, resolvedId));
      await tx.insert(artistGenreRelations).values(genreIds.map((genreId, index) => ({ artistId: resolvedId!, genreId, position: index })));

      for (const platform of metricPlatforms) {
        const value = metric(formData, `metric_${platform}`);
        await tx.insert(artistMetrics).values({ artistId: resolvedId, platform, value, updatedAt: new Date() }).onConflictDoUpdate({
          target: [artistMetrics.artistId, artistMetrics.platform],
          set: { value, updatedAt: new Date() },
        });
      }

      const recognizedLinkNames = socialPlatforms.flatMap((platform) => [platform, platformLabel(platform)]);
      await tx.delete(artistLinks).where(and(eq(artistLinks.artistId, resolvedId), inArray(artistLinks.platform, recognizedLinkNames)));
      const links = socialPlatforms.map((platform, position) => ({ platform, url: text(formData, `link_${platform}`), position })).filter((item) => item.url);
      if (links.length) await tx.insert(artistLinks).values(links.map((item) => ({
        artistId: resolvedId!,
        kind: item.platform === "spotify" || item.platform === "youtube" || item.platform === "soundcloud" ? "platform" : "social",
        platform: item.platform,
        label: platformLabel(item.platform),
        url: item.url,
        position: item.position,
        active: true,
      })));

      await tx.delete(artistEmbeds).where(and(eq(artistEmbeds.artistId, resolvedId), inArray(artistEmbeds.type, ["youtube", "spotify"])));
      const youtubeVideo = text(formData, "youtubeVideo");
      const spotifyEmbed = text(formData, "spotifyEmbed");
      if (youtubeVideo) await tx.insert(artistEmbeds).values({ artistId: resolvedId, type: "youtube", title: `Vídeo de ${name}`, url: youtubeVideo, position: 0, active: true, featured: true });
      if (spotifyEmbed) await tx.insert(artistEmbeds).values({ artistId: resolvedId, type: "spotify", title: `Spotify de ${name}`, url: spotifyEmbed, position: 1, active: true, featured: true });

      await tx.delete(artistPublicationPlacements).where(eq(artistPublicationPlacements.artistId, resolvedId));
      if (destinationIds.length) {
        const validDestinations = await tx.select({ id: artistPublicationDestinations.id, key: artistPublicationDestinations.key }).from(artistPublicationDestinations).where(and(inArray(artistPublicationDestinations.id, destinationIds), eq(artistPublicationDestinations.active, true)));
        await tx.insert(artistPublicationPlacements).values(validDestinations.map((destination) => ({
          artistId: resolvedId!,
          destinationId: destination.id,
          enabled: true,
          position: destination.key === "home_artists" ? integer(formData, "homePosition") : integer(formData, "listPosition"),
          updatedAt: new Date(),
        })));
        await tx.update(artists).set({ featureOnHome: validDestinations.some((item) => item.key === "home_artists") }).where(eq(artists.id, resolvedId));
      }

      return resolvedId;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar artista.";
    if (/duplicate key|unique/i.test(message)) return { ok: false, error: "Já existe um artista com esse slug." };
    return { ok: false, error: message };
  }

  await audit(session.user.id, id ? "artist.updated" : "artist.created", "artist", artistId, { name, slug, status, destinations: destinationIds.length });
  revalidateArtistContent([previousSlug, slug]);
  redirect(`/admin/artists/${artistId}?saved=1`);
}

export async function deleteArtistAction(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = uuidOrNull(text(formData, "id"));
  if (!id) throw new Error("Artista inválido.");
  const db = getDb();
  const current = (await db.select({ slug: artists.slug, name: artists.name }).from(artists).where(eq(artists.id, id)).limit(1))[0];
  if (!current) throw new Error("Artista não encontrado.");
  await db.delete(artists).where(eq(artists.id, id));
  await audit(session.user.id, "artist.deleted", "artist", id, { name: current.name, slug: current.slug });
  revalidateArtistContent([current.slug]);
  redirect("/admin/artists?deleted=1");
}
