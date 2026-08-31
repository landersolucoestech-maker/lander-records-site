import { and, asc, desc, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { artistGenreRelations, artistProfiles, artistPublicationDestinations, artistPublicationPlacements, musicGenres } from "../../../../lib/db/artist-management-schema";
import { artists, mediaAssets } from "../../../../lib/db/schema";
import ArtistManager, { type ArtistSummary } from "./ArtistManager";

export const dynamic = "force-dynamic";
type ArtistFilters = { deleted?: string; genre?: string; q?: string; status?: string };

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<ArtistFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const [filters, baseRows, profiles, genreRows, placementRows] = await Promise.all([
    searchParams,
    db.select({ artist: artists, cardImage: mediaAssets.url }).from(artists).leftJoin(mediaAssets, eq(artists.cardMediaId, mediaAssets.id)).orderBy(desc(artists.updatedAt), asc(artists.name)),
    db.select().from(artistProfiles),
    db.select({ artistId: artistGenreRelations.artistId, name: musicGenres.name }).from(artistGenreRelations).innerJoin(musicGenres, eq(artistGenreRelations.genreId, musicGenres.id)).orderBy(asc(artistGenreRelations.position)),
    db.select({ artistId: artistPublicationPlacements.artistId, key: artistPublicationDestinations.key, position: artistPublicationPlacements.position }).from(artistPublicationPlacements).innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id)).where(and(eq(artistPublicationPlacements.enabled, true), eq(artistPublicationDestinations.active, true))).orderBy(asc(artistPublicationPlacements.position)),
  ]);
  const profileMap = new Map(profiles.map((profile) => [profile.artistId, profile]));
  const summary: ArtistSummary[] = baseRows.map(({ artist, cardImage }) => {
    const profile = profileMap.get(artist.id);
    const status: ArtistSummary["status"] = artist.archivedAt ? "archived" : profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft";
    const isPubliclyVisible = !artist.archivedAt && artist.isPublished && profile?.isActive === true;
    const homePlacement = isPubliclyVisible ? placementRows.find((row) => row.artistId === artist.id && row.key === "home_artists") : undefined;
    return { id: artist.id, name: artist.name, slug: artist.slug, status, cardImage: cardImage || "", genres: genreRows.filter((row) => row.artistId === artist.id).map((row) => row.name), homePosition: homePlacement?.position, isPubliclyVisible, updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(artist.updatedAt) };
  });
  return <ArtistManager artists={summary} canEdit={session.user.role !== "viewer"} deleted={filters.deleted === "1"} initialFilters={{ genre: filters.genre, q: filters.q, status: filters.status }} />;
}
