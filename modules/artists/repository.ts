import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { artistGenreRelations, artistMetrics, artistProfiles, artistPublicationDestinations, artistPublicationPlacements, artistRoleRelations, artistRoles, musicGenres } from "@/lib/db/artist-management-schema";
import { artistCategories, artistCategoryRelations, artistEmbeds, artistLinks, artists, mediaAssets } from "@/lib/db/schema";
import type { PublicArtist } from "./types";
import { mockArtistCategories, mockArtists, mockDataEnabled } from "@/lib/mocks";
export { getSlugRedirect } from "@/modules/settings/repository";
export async function getArtistCategoriesForPublic() {
  if (mockDataEnabled()) return mockArtistCategories;
  return getDb().select().from(artistCategories).where(and(eq(artistCategories.active, true), eq(artistCategories.showAsFilter, true))).orderBy(asc(artistCategories.position), asc(artistCategories.name));
}

async function hydrateArtists(baseArtists: Array<typeof artists.$inferSelect>): Promise<PublicArtist[]> {
  if (!baseArtists.length) return [];
  const db = getDb();
  const ids = baseArtists.map((artist) => artist.id);
  const [relationRows, linkRows, embedRows, mediaRows, roleRows, genreRows, metricRows, profileRows, placementRows] = await Promise.all([
    db.select({ artistId: artistCategoryRelations.artistId, categoryId: artistCategories.id, name: artistCategories.name, slug: artistCategories.slug, isPrimary: artistCategoryRelations.isPrimary, position: artistCategoryRelations.position })
      .from(artistCategoryRelations).innerJoin(artistCategories, eq(artistCategoryRelations.categoryId, artistCategories.id)).where(and(inArray(artistCategoryRelations.artistId, ids), eq(artistCategories.active, true))).orderBy(asc(artistCategoryRelations.position)),
    db.select().from(artistLinks).where(and(inArray(artistLinks.artistId, ids), eq(artistLinks.active, true))).orderBy(asc(artistLinks.position)),
    db.select().from(artistEmbeds).where(and(inArray(artistEmbeds.artistId, ids), eq(artistEmbeds.active, true))).orderBy(asc(artistEmbeds.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
    db.select({ artistId: artistRoleRelations.artistId, name: artistRoles.name }).from(artistRoleRelations).innerJoin(artistRoles, eq(artistRoleRelations.roleId, artistRoles.id)).where(and(inArray(artistRoleRelations.artistId, ids), eq(artistRoles.active, true))).orderBy(asc(artistRoleRelations.position)),
    db.select({ artistId: artistGenreRelations.artistId, name: musicGenres.name }).from(artistGenreRelations).innerJoin(musicGenres, eq(artistGenreRelations.genreId, musicGenres.id)).where(and(inArray(artistGenreRelations.artistId, ids), eq(musicGenres.active, true))).orderBy(asc(artistGenreRelations.position)),
    db.select().from(artistMetrics).where(and(inArray(artistMetrics.artistId, ids), eq(artistMetrics.source, "soundcharts"))),
    db.select().from(artistProfiles).where(inArray(artistProfiles.artistId, ids)),
    db.select({ artistId: artistPublicationPlacements.artistId, key: artistPublicationDestinations.key }).from(artistPublicationPlacements).innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id)).where(and(inArray(artistPublicationPlacements.artistId, ids), eq(artistPublicationPlacements.enabled, true), eq(artistPublicationDestinations.active, true))).orderBy(asc(artistPublicationDestinations.position)),
  ]);
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  const profileMap = new Map(profileRows.map((profile) => [profile.artistId, profile]));

  return baseArtists.map((artist) => {
    const profile = profileMap.get(artist.id);
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      eyebrow: artist.eyebrow,
      shortBio: artist.shortBio,
      biography: artist.biography,
      cardImage: artist.cardMediaId ? mediaMap.get(artist.cardMediaId) ?? "" : "",
      heroImage: artist.heroMediaId ? mediaMap.get(artist.heroMediaId) ?? "" : "",
      ogImage: artist.ogMediaId ? mediaMap.get(artist.ogMediaId) ?? "" : "",
      seoTitle: artist.seoTitle,
      seoDescription: artist.seoDescription,
      canonicalUrl: artist.canonicalUrl,
      roles: roleRows.filter((row) => row.artistId === artist.id).map((row) => row.name),
      genres: genreRows.filter((row) => row.artistId === artist.id).map((row) => row.name),
      metrics: Object.fromEntries(metricRows.filter((row) => row.artistId === artist.id).map((row) => [row.platform, row.value])),
      profile: {
        isActive: profile?.isActive ?? true,
        pageLink: `/artistas/${artist.slug}`,
        hireTitle: profile?.hireTitle || "Contrate",
        hireText: profile?.hireText || "",
        hireButtonLabel: profile?.hireButtonLabel || "Quero contratar",
      },
      publicationDestinations: placementRows.filter((row) => row.artistId === artist.id).map((row) => row.key),
      categories: relationRows.filter((row) => row.artistId === artist.id).map((row) => ({ id: row.categoryId, name: row.name, slug: row.slug, isPrimary: row.isPrimary })),
      links: linkRows.filter((row) => row.artistId === artist.id).map((row) => ({ id: row.id, kind: row.kind, platform: row.platform, label: row.label, url: row.url })),
      embeds: embedRows.filter((row) => row.artistId === artist.id).map((row) => ({ id: row.id, type: row.type, title: row.title, url: row.url, featured: row.featured })),
    };
  });
}

export async function getPublishedArtists(featuredOnly = false) {
  if (mockDataEnabled()) return featuredOnly ? mockArtists.slice(0, 5) : mockArtists;
  const destinationKey = featuredOnly ? "home_artists" : "artists_index";
  const rows = await getDb().select({ artist: artists })
    .from(artists)
    .innerJoin(artistProfiles, eq(artists.id, artistProfiles.artistId))
    .innerJoin(artistPublicationPlacements, eq(artists.id, artistPublicationPlacements.artistId))
    .innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id))
    .where(and(
      eq(artists.isPublished, true),
      isNull(artists.archivedAt),
      eq(artistProfiles.isActive, true),
      eq(artistPublicationPlacements.enabled, true),
      eq(artistPublicationDestinations.active, true),
      eq(artistPublicationDestinations.key, destinationKey),
    ))
    .orderBy(asc(artistPublicationPlacements.position), asc(artists.name));
  return hydrateArtists(rows.map((row) => row.artist));
}

export async function getPublishedArtistBySlug(slug: string) {
  if (mockDataEnabled()) return mockArtists.find((artist) => artist.slug === slug) ?? null;
  const rows = await getDb().select({ artist: artists }).from(artists).innerJoin(artistProfiles, eq(artists.id, artistProfiles.artistId)).where(and(eq(artists.slug, slug), eq(artists.isPublished, true), isNull(artists.archivedAt), eq(artistProfiles.isActive, true))).limit(1);
  const hydrated = await hydrateArtists(rows.map((row) => row.artist));
  return hydrated[0] ?? null;
}
