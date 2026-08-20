import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../../../lib/db";
import { artistCategories, artistCategoryRelations, artistEmbeds, artistLinks, artists, mediaAssets } from "../../../../../lib/db/schema";
import { addArtistEmbed, addArtistLink, archiveArtist, deleteArtistEmbed, deleteArtistLink, setArtistPublication, updateArtist } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const saved = (await searchParams).saved;
  const db = getDb();
  const [artistRows, categories, relations, media, links, embeds] = await Promise.all([
    db.select().from(artists).where(eq(artists.id, id)).limit(1),
    db.select().from(artistCategories).orderBy(asc(artistCategories.position), asc(artistCategories.name)),
    db.select().from(artistCategoryRelations).where(eq(artistCategoryRelations.artistId, id)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
    db.select().from(artistLinks).where(eq(artistLinks.artistId, id)).orderBy(asc(artistLinks.position)),
    db.select().from(artistEmbeds).where(eq(artistEmbeds.artistId, id)).orderBy(asc(artistEmbeds.position)),
  ]);
  const artist = artistRows[0];
  if (!artist) notFound();
  const selected = new Set(relations.sort((a,b) => a.position-b.position).map((relation) => relation.categoryId));

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">ARTISTA</p><h1>{artist.name}</h1><p>Perfil público, mídia, taxonomia, destaque, links, embeds e SEO.</p></div>
        <div className="adminActions">{artist.isPublished && !artist.archivedAt ? <Link className="adminButton" href={`/artistas/${artist.slug}`} target="_blank">Ver perfil ↗</Link> : null}<Link className="adminButton" href="/admin/artists">Voltar</Link></div>
      </header>
      {saved ? <div className="adminAlert">Alterações salvas.</div> : null}

      <section className="adminPanel">
        <form action={updateArtist} className="adminForm">
          <input type="hidden" name="id" value={artist.id} />
          <div className="adminFormGrid">
            <label>Nome<input name="name" defaultValue={artist.name} required /></label>
            <label>Slug<input name="slug" defaultValue={artist.slug} required /></label>
            <label>Descrição curta / gênero<input name="eyebrow" defaultValue={artist.eyebrow} /></label>
            <label>Ordem em /artistas<input name="listPosition" type="number" defaultValue={artist.listPosition} /></label>
            <label className="full">Resumo / meta social curta<textarea name="shortBio" defaultValue={artist.shortBio} /></label>
            <label className="full">Biografia<textarea name="biography" defaultValue={artist.biography} /></label>
            <label>Imagem do card<select name="cardMediaId" defaultValue={artist.cardMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label>Imagem hero/capa<select name="heroMediaId" defaultValue={artist.heroMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label>Imagem social/OG<select name="ogMediaId" defaultValue={artist.ogMediaId || ""}><option value="">Usar hero/card</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label>Ordem na home<input name="homePosition" type="number" defaultValue={artist.homePosition} /></label>
            <label className="adminCheck"><input name="featureOnHome" type="checkbox" defaultChecked={artist.featureOnHome} /> Destacar na página inicial</label>
          </div>
          <div className="adminDivider" />
          <div><h3>Categorias</h3><div className="adminFormGrid">{categories.map((category) => <label className="adminCheck" key={category.id}><input name="categoryIds" value={category.id} type="checkbox" defaultChecked={selected.has(category.id)} /> {category.name}</label>)}</div></div>
          <div className="adminDivider" />
          <div className="adminFormGrid">
            <label>Título SEO<input name="seoTitle" defaultValue={artist.seoTitle} maxLength={180} /></label>
            <label>Canonical<input name="canonicalUrl" type="url" defaultValue={artist.canonicalUrl} /></label>
            <label className="full">Meta description<textarea name="seoDescription" defaultValue={artist.seoDescription} /></label>
          </div>
          <div className="adminActions"><button className="adminButton primary" type="submit">Salvar perfil</button></div>
        </form>
      </section>

      <section className="adminPanel adminStack">
        <h2>Links, redes e plataformas</h2>
        {links.map((link) => <div className="adminInlineForm" key={link.id}><span>{link.kind}</span><strong>{link.platform}</strong><span>{link.label}</span><a href={link.url} target="_blank" rel="noreferrer">Abrir ↗</a><span>#{link.position}</span><span>{link.active ? "Ativo" : "Inativo"}</span><form action={deleteArtistLink}><input type="hidden" name="id" value={link.id}/><input type="hidden" name="artistId" value={artist.id}/><button className="adminButton danger" type="submit">Remover</button></form></div>)}
        <form action={addArtistLink} className="adminInlineForm">
          <input type="hidden" name="artistId" value={artist.id} />
          <select name="kind" defaultValue="social"><option value="social">Social</option><option value="platform">Plataforma</option><option value="website">Website</option></select>
          <input name="platform" placeholder="Instagram" required />
          <input name="label" placeholder="Instagram" required />
          <input name="url" type="url" placeholder="https://..." required />
          <input name="position" type="number" defaultValue={0} />
          <span />
          <button className="adminButton primary" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="adminPanel adminStack">
        <h2>Mídia incorporada</h2>
        <p>Vídeos, players e links externos exibidos no perfil. Não há placeholder falso: só aparece publicamente o que estiver cadastrado.</p>
        {embeds.map((embed) => <div className="adminInlineForm" key={embed.id}><strong>{embed.type}</strong><span>{embed.title}</span><a href={embed.url} target="_blank" rel="noreferrer">Abrir ↗</a><span>#{embed.position}</span><span>{embed.featured ? "Destaque" : ""}</span><span>{embed.active ? "Ativo" : "Inativo"}</span><form action={deleteArtistEmbed}><input type="hidden" name="id" value={embed.id}/><input type="hidden" name="artistId" value={artist.id}/><button className="adminButton danger" type="submit">Remover</button></form></div>)}
        <form action={addArtistEmbed} className="adminInlineForm">
          <input type="hidden" name="artistId" value={artist.id} />
          <select name="type" defaultValue="youtube"><option value="youtube">YouTube</option><option value="spotify">Spotify</option><option value="soundcloud">SoundCloud</option><option value="other">Outro</option></select>
          <input name="title" placeholder="Título" required />
          <input name="url" type="url" placeholder="URL do vídeo/player" required />
          <input name="position" type="number" defaultValue={0} />
          <label className="adminCheck"><input name="featured" type="checkbox" /> Destaque</label>
          <span />
          <button className="adminButton primary" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="adminPanel">
        <h2>Publicação e ciclo de vida</h2>
        <div className="adminActions">
          {!artist.archivedAt ? <form action={setArtistPublication}><input type="hidden" name="id" value={artist.id}/><input type="hidden" name="action" value={artist.isPublished ? "unpublish" : "publish"}/><button className="adminButton primary" type="submit">{artist.isPublished ? "Despublicar" : "Publicar"}</button></form> : null}
          {!artist.archivedAt ? <form action={archiveArtist}><input type="hidden" name="id" value={artist.id}/><button className="adminButton danger" type="submit">Arquivar artista</button></form> : <span className="adminBadge archived">Artista arquivado</span>}
        </div>
      </section>
    </div>
  );
}
