import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { artists } from "../../../../lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const rows = await getDb().select().from(artists).orderBy(asc(artists.listPosition), asc(artists.name));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CONTEÚDO</p><h1>Artistas</h1><p>Cadastro, publicação, destaque, ordem e perfil público completo.</p></div><Link className="adminButton primary" href="/admin/artists/new">Adicionar artista</Link></header>
      <section className="adminPanel">
        <table className="adminTable"><thead><tr><th>Artista</th><th>Slug</th><th>Status</th><th>Home</th><th>Ordem</th><th></th></tr></thead>
          <tbody>{rows.map((artist) => <tr key={artist.id}><td><strong>{artist.name}</strong></td><td>{artist.slug}</td><td><span className={`adminBadge ${artist.archivedAt ? "archived" : artist.isPublished ? "live" : "draft"}`}>{artist.archivedAt ? "Arquivado" : artist.isPublished ? "Publicado" : "Rascunho"}</span></td><td>{artist.featureOnHome ? "Sim" : "Não"}</td><td>{artist.listPosition}</td><td><Link href={`/admin/artists/${artist.id}`}>Editar →</Link></td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
