import { and, asc, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import {
  artistGenreRelations,
  artistMetrics,
  artistProfiles,
  artistPublicationDestinations,
  artistPublicationPlacements,
  artistRoleRelations,
  artistRoles,
  musicGenres,
} from "../../../../lib/db/artist-management-schema";
import {
  artistCategories,
  artistCategoryRelations,
  artistEmbeds,
  artistLinks,
  artists,
  mediaAssets,
} from "../../../../lib/db/schema";

export async function loadArtistOptions() {
  await requireAdmin("editor");
  const db = getDb();
  const [media, categories, roles, genres, destinations] = await Promise.all([
    db.select({ id: mediaAssets.id, name: mediaAssets.originalFilename, url: mediaAssets.url }).from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
    db.select({ id: artistCategories.id, name: artistCategories.name }).from(artistCategories).where(eq(artistCategories.active, true)).orderBy(asc(artistCategories.position), asc(artistCategories.name)),
    db.select({ id: artistRoles.id, name: artistRoles.name }).from(artistRoles).where(eq(artistRoles.active, true)).orderBy(asc(artistRoles.position), asc(artistRoles.name)),
    db.select({ id: musicGenres.id, name: musicGenres.name }).from(musicGenres).where(eq(musicGenres.active, true)).orderBy(asc(musicGenres.position), asc(musicGenres.name)),
    db.select({ id: artistPublicationDestinations.id, name: artistPublicationDestinations.label, description: artistPublicationDestinations.description }).from(artistPublicationDestinations).where(eq(artistPublicationDestinations.active, true)).orderBy(asc(artistPublicationDestinations.position)),
  ]);
  return { media, categories, roles, genres, destinations };
}

export async function loadArtistEditor(id: string) {
  await requireAdmin("editor");
  const db = getDb();
  const [artistRows, profileRows, categoryRows, roleRows, genreRows, destinationRows, metrics, links, embeds, mediaRows] = await Promise.all([
    db.select().from(artists).where(eq(artists.id, id)).limit(1),
    db.select().from(artistProfiles).where(eq(artistProfiles.artistId, id)).limit(1),
    db.select().from(artistCategoryRelations).where(eq(artistCategoryRelations.artistId, id)).orderBy(asc(artistCategoryRelations.position)),
    db.select().from(artistRoleRelations).where(eq(artistRoleRelations.artistId, id)).orderBy(asc(artistRoleRelations.position)),
    db.select().from(artistGenreRelations).where(eq(artistGenreRelations.artistId, id)).orderBy(asc(artistGenreRelations.position)),
    db.select().from(artistPublicationPlacements).where(and(eq(artistPublicationPlacements.artistId, id), eq(artistPublicationPlacements.enabled, true))),
    db.select().from(artistMetrics).where(and(eq(artistMetrics.artistId, id), eq(artistMetrics.source, "soundcharts"))),
    db.select().from(artistLinks).where(and(eq(artistLinks.artistId, id), eq(artistLinks.active, true))).orderBy(asc(artistLinks.position)),
    db.select().from(artistEmbeds).where(and(eq(artistEmbeds.artistId, id), eq(artistEmbeds.active, true))).orderBy(asc(artistEmbeds.position)),
    db.select({ id: mediaAssets.id, url: mediaAssets.url }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const artist = artistRows[0];
  if (!artist) return null;
  const profile = profileRows[0];
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  const linkMap = Object.fromEntries(links.map((link) => [link.platform.toLowerCase(), link.url]));
  const metricMap = Object.fromEntries(metrics.map((item) => [item.platform, item.value]));
  const youtubeVideo = embeds.find((embed) => embed.type.toLowerCase() === "youtube")?.url || "";
  const spotifyEmbed = embeds.find((embed) => embed.type.toLowerCase() === "spotify")?.url || "";
  const status = artist.archivedAt || profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft";

  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    status: status as "published" | "draft" | "inactive",
    shortBio: artist.shortBio,
    biography: artist.biography,
    cardMediaId: artist.cardMediaId || "",
    heroMediaId: artist.heroMediaId || "",
    ogMediaId: artist.ogMediaId || "",
    cardImage: artist.cardMediaId ? mediaMap.get(artist.cardMediaId) || "" : "",
    heroImage: artist.heroMediaId ? mediaMap.get(artist.heroMediaId) || "" : "",
    categoryIds: categoryRows.map((item) => item.categoryId),
    roleIds: roleRows.map((item) => item.roleId),
    genreIds: genreRows.map((item) => item.genreId),
    destinationIds: destinationRows.map((item) => item.destinationId),
    metrics: metricMap,
    links: linkMap,
    pageLink: profile?.pageLink || `/artistas/${artist.slug}`,
    hireTitle: profile?.hireTitle || "Contrate",
    hireText: profile?.hireText || "",
    hireButtonLabel: profile?.hireButtonLabel || "Quero contratar",
    youtubeVideo,
    spotifyEmbed,
    homePosition: artist.homePosition,
    listPosition: artist.listPosition,
    seoTitle: artist.seoTitle,
    seoDescription: artist.seoDescription,
    canonicalUrl: artist.canonicalUrl,
  };
}
