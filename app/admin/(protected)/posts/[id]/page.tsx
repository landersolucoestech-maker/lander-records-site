import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../../../lib/db";
import { mediaAssets, postCategories, postTags, posts, tags } from "../../../../../lib/db/schema";
import { setPostPublication, updatePost } from "../../../actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(value: Date | null) {
  if (!value) return "";
  const shifted = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const saved = (await searchParams).saved;
  const db = getDb();
  const [postRows, categories, media, allTags, selectedTags] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
    db.select().from(postCategories).orderBy(asc(postCategories.position), asc(postCategories.name)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
    db.select().from(tags).orderBy(asc(tags.name)),
    db.select().from(postTags).where(eq(postTags.postId, id)),
  ]);
  const post = postRows[0];
  if (!post) notFound();

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">PUBLICAÇÃO</p><h1>{post.title}</h1><p>Editor Markdown, capa, categoria, destaque, programação e metadados de busca/social.</p></div><div className="adminActions">{post.status === "published" ? <Link className="adminButton" href={`/noticias/${post.slug}`} target="_blank">Ver matéria ↗</Link> : null}<Link className="adminButton" href="/admin/posts">Voltar</Link></div></header>
      {saved ? <div className="adminAlert">Alterações salvas.</div> : null}
      <section className="adminPanel">
        <form action={updatePost} className="adminForm">
          <input type="hidden" name="id" value={post.id}/>
          <div className="adminFormGrid">
            <label>Título<input name="title" defaultValue={post.title} required /></label>
            <label>Slug<input name="slug" defaultValue={post.slug} required /></label>
            <label>Autor<input name="authorName" defaultValue={post.authorName} /></label>
            <label>Categoria<select name="categoryId" defaultValue={post.categoryId || ""}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="full">Resumo<textarea name="excerpt" defaultValue={post.excerpt} /></label>
            <label className="full">Conteúdo (Markdown)<textarea name="contentMarkdown" defaultValue={post.contentMarkdown} style={{ minHeight: 360 }} /></label>
            <label>Capa<select name="coverMediaId" defaultValue={post.coverMediaId || ""}><option value="">Sem capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label>Imagem OG<select name="ogMediaId" defaultValue={post.ogMediaId || ""}><option value="">Usar capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label>Agendar para<input name="scheduledAt" type="datetime-local" defaultValue={dateTimeLocal(post.scheduledAt)} /></label>
            <label>Ordem na home<input name="homePosition" type="number" defaultValue={post.homePosition} /></label>
            <label className="adminCheck"><input name="featuredOnHome" type="checkbox" defaultChecked={post.featuredOnHome} /> Destaque na home</label>
          </div>
          <div className="adminDivider" />
          <div><h3>Tags</h3><div className="adminFormGrid">{allTags.map((tag) => <label className="adminCheck" key={tag.id}><input name="tagIds" value={tag.id} type="checkbox" defaultChecked={selectedTags.some((item) => item.tagId === tag.id)} /> {tag.name}</label>)}</div></div>
          <div className="adminDivider" />
          <div className="adminFormGrid">
            <label>Título SEO<input name="seoTitle" defaultValue={post.seoTitle} maxLength={180} /></label>
            <label>Canonical<input name="canonicalUrl" type="url" defaultValue={post.canonicalUrl} /></label>
            <label className="full">Meta description<textarea name="seoDescription" defaultValue={post.seoDescription} /></label>
          </div>
          <button className="adminButton primary" type="submit">Salvar publicação</button>
        </form>
      </section>
      <section className="adminPanel">
        <h2>Publicação</h2>
        <div className="adminActions">
          <form action={setPostPublication}><input type="hidden" name="id" value={post.id}/><input type="hidden" name="action" value={post.status === "published" ? "draft" : "publish"}/><button className="adminButton primary" type="submit">{post.status === "published" ? "Despublicar para rascunho" : "Publicar agora"}</button></form>
          {post.status !== "archived" ? <form action={setPostPublication}><input type="hidden" name="id" value={post.id}/><input type="hidden" name="action" value="archive"/><button className="adminButton danger" type="submit">Arquivar</button></form> : <span className="adminBadge archived">Arquivado</span>}
        </div>
      </section>
    </div>
  );
}
