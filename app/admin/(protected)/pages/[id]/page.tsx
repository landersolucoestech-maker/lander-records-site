import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../../../lib/db";
import { pageSectionBindings, sectionDefinitions } from "../../../../../lib/db/page-management-schema";
import { mediaAssets, pageSectionItems, pageSections, pages } from "../../../../../lib/db/schema";
import { addPageSectionItem, deletePageSectionItem, updatePage, updatePageSection, updatePageSectionItem } from "../../../actions";
import { attachSectionAction, detachSectionAction } from "../../../page-actions";

export const dynamic = "force-dynamic";

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [pageRows, sections, media, definitions, bindings] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
    db.select().from(sectionDefinitions).where(eq(sectionDefinitions.active, true)).orderBy(asc(sectionDefinitions.name)),
    db.select({ pageSectionId: pageSectionBindings.pageSectionId, definitionId: sectionDefinitions.id, definitionKey: sectionDefinitions.key, definitionName: sectionDefinitions.name })
      .from(pageSectionBindings)
      .innerJoin(sectionDefinitions, eq(pageSectionBindings.definitionId, sectionDefinitions.id)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();

  const items = sections.length ? await db.select().from(pageSectionItems).orderBy(asc(pageSectionItems.position)) : [];
  const sectionIds = new Set(sections.map((section) => section.id));
  const pageBindings = bindings.filter((binding) => sectionIds.has(binding.pageSectionId));
  const definitionBySection = new Map(pageBindings.map((binding) => [binding.pageSectionId, binding]));
  const attachedKeys = new Set(pageBindings.map((binding) => binding.definitionKey));
  const availableDefinitions = definitions.filter((definition) => !attachedKeys.has(definition.key));

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">PÁGINA</p><h1>{page.title}</h1><p>Metadados da rota e conteúdo de seções identificadas e vinculadas explicitamente.</p></div><div className="adminActions"><Link className="adminButton" href={`/admin/pages/${id}/view`}>Ver</Link><Link className="adminButton" href="/admin/pages">Voltar</Link></div></header>
      <section className="adminPanel">
        <form action={updatePage} className="adminForm"><input type="hidden" name="id" value={page.id}/><div className="adminFormGrid"><label>Nome da página<input name="title" defaultValue={page.title}/></label><label>Rota<input name="slug" defaultValue={page.slug}/></label><label>Título SEO<input name="seoTitle" defaultValue={page.seoTitle}/></label><label>Canonical<input name="canonicalUrl" type="url" defaultValue={page.canonicalUrl}/></label><label className="full">Meta description<textarea name="seoDescription" defaultValue={page.seoDescription}/></label><label>Imagem OG<select name="ogMediaId" defaultValue={page.ogMediaId || ""}><option value="">Padrão do site</option>{media.map((m) => <option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked={page.enabled}/> Página ativa</label></div><button className="adminButton primary" type="submit">Salvar página</button></form>
      </section>

      <section className="adminPanel adminStack">
        <div className="adminPageHeader"><div><h2>Vincular seção existente</h2><p>Selecione uma seção do catálogo permanente do CMS. O vínculo cria uma instância administrável nesta página, mantendo ID e chave inequívocos.</p></div></div>
        {availableDefinitions.length ? <form action={attachSectionAction} className="adminInlineForm"><input type="hidden" name="pageId" value={page.id}/><select name="definitionId" required defaultValue=""><option value="" disabled>Selecionar seção...</option>{availableDefinitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.name} · {definition.key} · {definition.type}</option>)}</select><span/><span/><span/><span/><span/><button className="adminButton primary" type="submit">Vincular seção</button></form> : <div className="adminEmpty">Todas as seções disponíveis já estão vinculadas a esta página.</div>}
      </section>

      {sections.map((section) => {
        const sectionItems = items.filter((item) => item.sectionId === section.id);
        const definition = definitionBySection.get(section.id);
        return <section className="adminPanel adminStack" key={section.id}>
          <div className="adminPageHeader"><div><strong>{definition?.definitionName || section.sectionKey}</strong><div><span className="adminCode">key:{section.sectionKey}</span> <span className="adminCode">sectionId:{section.id}</span> {definition?.definitionId ? <span className="adminCode">definitionId:{definition.definitionId}</span> : null} <span className="adminBadge">{section.type}</span></div></div><details><summary className="adminButton" aria-label={`Ações da seção ${section.sectionKey}`}>•••</summary><form action={detachSectionAction} style={{marginTop:8}}><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="sectionId" value={section.id}/><button className="adminButton danger" type="submit">Desvincular seção</button></form></details></div>
          <form action={updatePageSection} className="adminForm adminSectionCard">
            <input type="hidden" name="id" value={section.id}/><input type="hidden" name="pageId" value={page.id}/>
            <div className="adminFormGrid">
              <label>Eyebrow<input name="eyebrow" defaultValue={section.eyebrow}/></label><label>Ordem<input name="position" type="number" defaultValue={section.position}/></label>
              <label className="full">Título<textarea name="title" defaultValue={section.title}/></label><label className="full">Subtítulo<textarea name="subtitle" defaultValue={section.subtitle}/></label><label className="full">Corpo<textarea name="body" defaultValue={section.body}/></label>
              <label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked={section.enabled}/> Seção ativa</label>
            </div><button className="adminButton" type="submit">Salvar seção</button>
          </form>

          {sectionItems.length ? <h3>Itens repetíveis</h3> : null}
          {sectionItems.map((item) => <form action={updatePageSectionItem} className="adminForm adminSectionCard" key={item.id}>
            <input type="hidden" name="id" value={item.id}/><input type="hidden" name="pageId" value={page.id}/>
            <div className="adminFormGrid"><label>Chave<input name="itemKey" defaultValue={item.itemKey}/></label><label>Ordem<input name="position" type="number" defaultValue={item.position}/></label><label>Título<input name="title" defaultValue={item.title}/></label><label>Subtítulo<input name="subtitle" defaultValue={item.subtitle}/></label><label className="full">Corpo<textarea name="body" defaultValue={item.body}/></label><label>Rótulo/CTA<input name="label" defaultValue={item.label}/></label><label>URL<input name="url" defaultValue={item.url}/></label><label>Mídia<select name="mediaId" defaultValue={item.mediaId || ""}><option value="">Nenhuma</option>{media.map((m) => <option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked={item.enabled}/> Item ativo</label></div>
            <div className="adminActions"><button className="adminButton" type="submit">Salvar item</button><button className="adminButton danger" formAction={deletePageSectionItem} type="submit">Excluir item</button></div>
          </form>)}

          <details><summary>Adicionar item à seção</summary><form action={addPageSectionItem} className="adminForm adminSectionCard"><input type="hidden" name="sectionId" value={section.id}/><input type="hidden" name="pageId" value={page.id}/><div className="adminFormGrid"><label>Chave<input name="itemKey"/></label><label>Ordem<input name="position" type="number" defaultValue={sectionItems.length}/></label><label>Título<input name="title"/></label><label>Subtítulo<input name="subtitle"/></label><label className="full">Corpo<textarea name="body"/></label><label>Rótulo/CTA<input name="label"/></label><label>URL<input name="url"/></label><label>Mídia<select name="mediaId" defaultValue=""><option value="">Nenhuma</option>{media.map((m) => <option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label></div><button className="adminButton primary" type="submit">Adicionar item</button></form></details>
        </section>;
      })}
    </div>
  );
}
