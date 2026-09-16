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
import { artists, mediaAssets, releases } from "../../../../lib/db/schema";
import ArtistManager, { type ArtistSummary } from "./ArtistManager";

export const dynamic = "force-dynamic";
type ArtistFilters = { deleted?: string; genre?: string; q?: string; status?: string };

function catalogArtistKey(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<ArtistFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const [filters, baseRows, profiles, genreRows, roleRows, placementRows, metricRows, releaseRows] = await Promise.all([
    searchParams,
    db.select({ artist: artists, cardImage: mediaAssets.url }).from(artists).leftJoin(mediaAssets, eq(artists.cardMediaId, mediaAssets.id)).orderBy(desc(artists.updatedAt), asc(artists.name)),
    db.select().from(artistProfiles),
    db.select({ artistId: artistGenreRelations.artistId, name: musicGenres.name }).from(artistGenreRelations).innerJoin(musicGenres, eq(artistGenreRelations.genreId, musicGenres.id)).orderBy(asc(artistGenreRelations.position)),
    db.select({ artistId: artistRoleRelations.artistId, name: artistRoles.name }).from(artistRoleRelations).innerJoin(artistRoles, eq(artistRoleRelations.roleId, artistRoles.id)).orderBy(asc(artistRoleRelations.position)),
    db.select({ artistId: artistPublicationPlacements.artistId, key: artistPublicationDestinations.key, position: artistPublicationPlacements.position }).from(artistPublicationPlacements).innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id)).where(and(eq(artistPublicationPlacements.enabled, true), eq(artistPublicationDestinations.active, true))).orderBy(asc(artistPublicationPlacements.position)),
    db.select({ artistId: artistMetrics.artistId, platform: artistMetrics.platform, value: artistMetrics.value }).from(artistMetrics),
    db.select({ artistName: releases.artistName }).from(releases).where(eq(releases.active, true)),
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.artistId, profile]));
  const genresByArtist = new Map<string, string[]>();
  const rolesByArtist = new Map<string, string[]>();
  const metricsByArtist = new Map<string, Map<string, number>>();
  const releasesByArtistName = new Map<string, number>();

  for (const row of genreRows) {
    const values = genresByArtist.get(row.artistId) || [];
    values.push(row.name);
    genresByArtist.set(row.artistId, values);
  }
  for (const row of roleRows) {
    const values = rolesByArtist.get(row.artistId) || [];
    values.push(row.name);
    rolesByArtist.set(row.artistId, values);
  }
  for (const row of metricRows) {
    const metrics = metricsByArtist.get(row.artistId) || new Map<string, number>();
    metrics.set(row.platform, Math.max(metrics.get(row.platform) || 0, row.value || 0));
    metricsByArtist.set(row.artistId, metrics);
  }
  for (const row of releaseRows) {
    const key = catalogArtistKey(row.artistName);
    releasesByArtistName.set(key, (releasesByArtistName.get(key) || 0) + 1);
  }

  const summary: ArtistSummary[] = baseRows.map(({ artist, cardImage }) => {
    const profile = profileMap.get(artist.id);
    const status: ArtistSummary["status"] = artist.archivedAt ? "archived" : profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft";
    const isPubliclyVisible = !artist.archivedAt && artist.isPublished && profile?.isActive === true;
    const homePlacement = isPubliclyVisible ? placementRows.find((row) => row.artistId === artist.id && row.key === "home_artists") : undefined;
    const audience = [...(metricsByArtist.get(artist.id)?.values() || [])].reduce((total, value) => total + Math.max(0, value), 0);
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      status,
      cardImage: cardImage || "",
      genres: genresByArtist.get(artist.id) || [],
      roles: rolesByArtist.get(artist.id) || [],
      releaseCount: releasesByArtistName.get(catalogArtistKey(artist.name)) || 0,
      audience,
      homePosition: homePlacement?.position,
      isPubliclyVisible,
      updatedAt: artist.updatedAt.toISOString(),
    };
  });

  return <ArtistManager artists={summary} canEdit={session.source === "session" && session.user.role !== "viewer"} deleted={filters.deleted === "1"} initialFilters={{ genre: filters.genre, q: filters.q, status: filters.status }} />;
}
