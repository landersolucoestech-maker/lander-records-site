import { and, asc, desc, eq } from "drizzle-orm";
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
import { integrationMetricCache } from "../../../../lib/db/integration-schema";
import { artistCategoryRelations, artistEmbeds, artistLinks, artists, mediaAssets } from "../../../../lib/db/schema";
import ArtistManager, { type ArtistSummary } from "./ArtistManager";
import type { ArtistEditorInitial, ArtistFormOptions } from "./ArtistForm";
import { loadArtistOptions } from "./editor-data";

export const dynamic = "force-dynamic";
type ArtistFilters = { deleted?: string; genre?: string; q?: string; role?: string; saved?: string; status?: string };

const VIEW_METRICS = new Set(["views", "view_count", "video_views", "video_view_count", "total_views"]);

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<ArtistFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const canEdit = session.source === "session" && session.user.role !== "viewer";
  const canDelete = session.source === "session" && (session.user.role === "admin" || session.user.role === "owner");
  const emptyOptions: ArtistFormOptions = { media: [], categories: [], roles: [], genres: [], destinations: [] };
  const [filters, baseRows, profiles, categoryRows, genreRows, roleRows, placementRows, metricRows, cachedMetricRows, linkRows, embedRows, editorOptions] = await Promise.all([
    searchParams,
    db.select({ artist: artists, cardImage: mediaAssets.url }).from(artists).leftJoin(mediaAssets, eq(artists.cardMediaId, mediaAssets.id)).orderBy(desc(artists.updatedAt), asc(artists.name)),
    db.select().from(artistProfiles),
    db.select({ artistId: artistCategoryRelations.artistId, categoryId: artistCategoryRelations.categoryId }).from(artistCategoryRelations).orderBy(asc(artistCategoryRelations.position)),
    db.select({ artistId: artistGenreRelations.artistId, genreId: artistGenreRelations.genreId, name: musicGenres.name }).from(artistGenreRelations).innerJoin(musicGenres, eq(artistGenreRelations.genreId, musicGenres.id)).orderBy(asc(artistGenreRelations.position)),
    db.select({ artistId: artistRoleRelations.artistId, roleId: artistRoleRelations.roleId, name: artistRoles.name }).from(artistRoleRelations).innerJoin(artistRoles, eq(artistRoleRelations.roleId, artistRoles.id)).orderBy(asc(artistRoleRelations.position)),
    db.select({ artistId: artistPublicationPlacements.artistId, destinationId: artistPublicationPlacements.destinationId, key: artistPublicationDestinations.key, position: artistPublicationPlacements.position }).from(artistPublicationPlacements).innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id)).where(and(eq(artistPublicationPlacements.enabled, true), eq(artistPublicationDestinations.active, true))).orderBy(asc(artistPublicationPlacements.position)),
    db.select({ artistId: artistMetrics.artistId, platform: artistMetrics.platform, value: artistMetrics.value }).from(artistMetrics),
    db.select({ artistId: integrationMetricCache.entityId, platform: integrationMetricCache.platform, metric: integrationMetricCache.metric, value: integrationMetricCache.value }).from(integrationMetricCache).where(eq(integrationMetricCache.entityType, "artist")),
    db.select({ artistId: artistLinks.artistId, platform: artistLinks.platform, url: artistLinks.url }).from(artistLinks).where(eq(artistLinks.active, true)).orderBy(asc(artistLinks.position)),
    db.select({ artistId: artistEmbeds.artistId, type: artistEmbeds.type, url: artistEmbeds.url }).from(artistEmbeds).where(eq(artistEmbeds.active, true)).orderBy(asc(artistEmbeds.position)),
    canEdit ? loadArtistOptions() : Promise.resolve(emptyOptions),
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.artistId, profile]));
  const categoryIdsByArtist = new Map<string, string[]>();
  const genreIdsByArtist = new Map<string, string[]>();
  const roleIdsByArtist = new Map<string, string[]>();
  const destinationIdsByArtist = new Map<string, string[]>();
  const genresByArtist = new Map<string, string[]>();
  const rolesByArtist = new Map<string, string[]>();
  const linksByArtist = new Map<string, Record<string, string>>();
  const embedsByArtist = new Map<string, Record<string, string>>();
  const metricsByArtist = new Map<string, Map<string, number>>();
  const viewsByArtist = new Map<string, Map<string, number>>();
  const editorById: Record<string, ArtistEditorInitial> = {};

  for (const row of categoryRows) {
    const values = categoryIdsByArtist.get(row.artistId) || [];
    values.push(row.categoryId);
    categoryIdsByArtist.set(row.artistId, values);
  }
  for (const row of genreRows) {
    const values = genresByArtist.get(row.artistId) || [];
    values.push(row.name);
    genresByArtist.set(row.artistId, values);
    const ids = genreIdsByArtist.get(row.artistId) || [];
    ids.push(row.genreId);
    genreIdsByArtist.set(row.artistId, ids);
  }
  for (const row of roleRows) {
    const values = rolesByArtist.get(row.artistId) || [];
    values.push(row.name);
    rolesByArtist.set(row.artistId, values);
    const ids = roleIdsByArtist.get(row.artistId) || [];
    ids.push(row.roleId);
    roleIdsByArtist.set(row.artistId, ids);
  }
  for (const row of placementRows) {
    const values = destinationIdsByArtist.get(row.artistId) || [];
    values.push(row.destinationId);
    destinationIdsByArtist.set(row.artistId, values);
  }
  for (const row of linkRows) {
    const values = linksByArtist.get(row.artistId) || {};
    values[row.platform.toLowerCase()] = row.url;
    linksByArtist.set(row.artistId, values);
  }
  for (const row of embedRows) {
    const values = embedsByArtist.get(row.artistId) || {};
    values[row.type.toLowerCase()] = row.url;
    embedsByArtist.set(row.artistId, values);
  }
  for (const row of metricRows) {
    const metrics = metricsByArtist.get(row.artistId) || new Map<string, number>();
    metrics.set(row.platform, Math.max(metrics.get(row.platform) || 0, row.value || 0));
    metricsByArtist.set(row.artistId, metrics);
  }
  for (const row of cachedMetricRows) {
    if (!VIEW_METRICS.has(row.metric.toLowerCase())) continue;
    const platformViews = viewsByArtist.get(row.artistId) || new Map<string, number>();
    platformViews.set(row.platform, Math.max(platformViews.get(row.platform) || 0, row.value || 0));
    viewsByArtist.set(row.artistId, platformViews);
  }

  const summary: ArtistSummary[] = baseRows.map(({ artist, cardImage }) => {
    const profile = profileMap.get(artist.id);
    const status: ArtistSummary["status"] = artist.archivedAt ? "archived" : profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft";
    const isPubliclyVisible = !artist.archivedAt && artist.isPublished && profile?.isActive === true;
    const homePlacement = isPubliclyVisible ? placementRows.find((row) => row.artistId === artist.id && row.key === "home_artists") : undefined;
    const audience = [...(metricsByArtist.get(artist.id)?.values() || [])].reduce((total, value) => total + Math.max(0, value), 0);
    const platformViews = viewsByArtist.get(artist.id);
    const views = platformViews ? [...platformViews.values()].reduce((total, value) => total + Math.max(0, value), 0) : undefined;
    if (canEdit) {
      const embeds = embedsByArtist.get(artist.id) || {};
      editorById[artist.id] = {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        status: artist.archivedAt || profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft",
        shortBio: artist.shortBio,
        biography: artist.biography,
        cardMediaId: artist.cardMediaId || "",
        heroMediaId: artist.heroMediaId || "",
        ogMediaId: artist.ogMediaId || "",
        cardImage: cardImage || "",
        categoryIds: categoryIdsByArtist.get(artist.id) || [],
        roleIds: roleIdsByArtist.get(artist.id) || [],
        genreIds: genreIdsByArtist.get(artist.id) || [],
        destinationIds: destinationIdsByArtist.get(artist.id) || [],
        metrics: Object.fromEntries(metricsByArtist.get(artist.id) || []),
        links: linksByArtist.get(artist.id) || {},
        hireTitle: profile?.hireTitle || "Contrate",
        hireText: profile?.hireText || "",
        hireButtonLabel: profile?.hireButtonLabel || "Quero contratar",
        youtubeVideo: embeds.youtube || "",
        spotifyEmbed: embeds.spotify || "",
        homePosition: artist.homePosition,
        listPosition: artist.listPosition,
        seoTitle: artist.seoTitle,
        seoDescription: artist.seoDescription,
        canonicalUrl: artist.canonicalUrl,
      };
    }
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      status,
      cardImage: cardImage || "",
      genres: genresByArtist.get(artist.id) || [],
      roles: rolesByArtist.get(artist.id) || [],
      views,
      audience,
      homePosition: homePlacement?.position,
      isPubliclyVisible,
      shortBio: artist.shortBio || "",
      biography: artist.biography || "",
      updatedAt: artist.updatedAt.toISOString(),
    };
  });

  return <ArtistManager artists={summary} canDelete={canDelete} canEdit={canEdit} deleted={filters.deleted === "1"} editorById={editorById} editorOptions={editorOptions} initialFilters={{ genre: filters.genre, q: filters.q, role: filters.role, status: filters.status }} saved={filters.saved === "1"} />;
}
