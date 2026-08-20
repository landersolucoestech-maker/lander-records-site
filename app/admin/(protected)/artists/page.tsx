import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
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
import { artistCategories, artistCategoryRelations, artists, mediaAssets } from "../../../../lib/db/schema";
import ArtistManager, { type ArtistSummary } from "./ArtistManager";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const db = getDb();
  const [baseRows, profiles, roleRows, genreRows, categoryRows, placementRows, metricRows] = await Promise.all([
    db.select({ artist: artists, cardImage: mediaAssets.url }).from(artists).leftJoin(mediaAssets, eq(artists.cardMediaId, mediaAssets.id)).orderBy(desc(artists.updatedAt), asc(artists.name)),
    db.select().from(artistProfiles),
    db.select({ artistId: artistRoleRelations.artistId, name: artistRoles.name }).from(artistRoleRelations).innerJoin(artistRoles, eq(artistRoleRelations.roleId, artistRoles.id)).orderBy(asc(artistRoleRelations.position)),
    db.select({ artistId: artistGenreRelations.artistId, name: musicGenres.name }).from(artistGenreRelations).innerJoin(musicGenres, eq(artistGenreRelations.genreId, musicGenres.id)).orderBy(asc(artistGenreRelations.position)),
    db.select({ artistId: artistCategoryRelations.artistId, name: artistCategories.name }).from(artistCategoryRelations).innerJoin(artistCategories, eq(artistCategoryRelations.categoryId, artistCategories.id)).orderBy(asc(artistCategoryRelations.position)),
    db.select({ artistId: artistPublicationPlacements.artistId, label: artistPublicationDestinations.label }).from(artistPublicationPlacements).innerJoin(artistPublicationDestinations, eq(artistPublicationPlacements.destinationId, artistPublicationDestinations.id)).where(eq(artistPublicationPlacements.enabled, true)).orderBy(asc(artistPublicationDestinations.position)),
    db.select().from(artistMetrics),
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.artistId, profile]));
  const summary: ArtistSummary[] = baseRows.map(({ artist, cardImage }) => {
    const profile = profileMap.get(artist.id);
    const metrics = Object.fromEntries(metricRows.filter((row) => row.artistId === artist.id).map((row) => [row.platform, row.value]));
    const status: ArtistSummary["status"] = artist.archivedAt ? "archived" : profile?.isActive === false ? "inactive" : artist.isPublished ? "published" : "draft";
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      status,
      cardImage: cardImage || "",
      roles: roleRows.filter((row) => row.artistId === artist.id).map((row) => row.name),
      genres: genreRows.filter((row) => row.artistId === artist.id).map((row) => row.name),
      categories: categoryRows.filter((row) => row.artistId === artist.id).map((row) => row.name),
      destinations: placementRows.filter((row) => row.artistId === artist.id).map((row) => row.label),
      metrics,
      updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(artist.updatedAt),
    };
  });
  const { deleted } = await searchParams;

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">CONTEÚDO</p><h1>Artistas</h1><p>Gestão completa de identidade, funções, gêneros, métricas, plataformas, mídia e destinos de publicação.</p></div>
        <Link className="adminButton primary" href="/admin/artists/new">Adicionar artista</Link>
      </header>
      <ArtistManager artists={summary} deleted={deleted === "1"} />
    </div>
  );
}
