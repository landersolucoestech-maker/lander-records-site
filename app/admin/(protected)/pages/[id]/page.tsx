import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../../../lib/db";
import { mediaAssets, pageSectionItems, pageSections, pages } from "../../../../../lib/db/schema";
import { updatePageSection, updatePageSectionItem } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function PageContentEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [pageRows, sections, media] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();

  const items = sections.length ? await db.select().from(pageSectionItems).orderBy(asc(pageSectionItems.position)) : [];
  const publicRoute = page.slug ? `/${page.slug}` : "/";

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div>
          <h1>{page.title}</h1>
          <p>Edite somente o conteúdo dos frames já implementados no site. Estrutura, rota, ordem e existência das seções permanecem definidas no VS Code.</p>
        </div>
        <div className="adminActions">
          <Link className="adminButton" href={publicRoute} target="_blank">Ver página</Link>
          <Link className="adminButton" href="/admin/pages">Voltar</Link>
        </div>
      </header>

      {sections.length ? sections.map((section) => {
        const sectionItems = items.filter((item) => item.sectionId === section.id);
        return (
          <section className="adminPanel adminStack" key={section.id}>
            <div className="adminPageHeader">
              <div>
                <h2>{section.title || section.sectionKey}</h2>
                <p><span className="adminCode">{section.sectionKey}</span> · frame renderizado no site</p>
              </div>
            </div>

            <form action={updatePageSection} className="adminForm adminSectionCard">
              <input type="hidden" name="id" value={section.id}/>
              <input type="hidden" name="pageId" value={page.id}/>
              <input type="hidden" name="position" value={section.position}/>
              <input type="hidden" name="enabled" value={section.enabled ? "true" : ""}/>
              <div className="adminFormGrid">
                <label>Chamada curta<input name="eyebrow" defaultValue={section.eyebrow}/></label>
                <label className="full">Título<textarea name="title" defaultValue={section.title}/></label>
                <label className="full">Subtítulo<textarea name="subtitle" defaultValue={section.subtitle}/></label>
                <label className="full">Texto<textarea name="body" defaultValue={section.body}/></label>
              </div>
              <button className="adminButton primary" type="submit">Salvar conteúdo da seção</button>
            </form>

            {sectionItems.map((item) => (
              <form action={updatePageSectionItem} className="adminForm adminSectionCard" key={item.id}>
                <input type="hidden" name="id" value={item.id}/>
                <input type="hidden" name="pageId" value={page.id}/>
                <input type="hidden" name="itemKey" value={item.itemKey}/>
                <input type="hidden" name="position" value={item.position}/>
                <input type="hidden" name="enabled" value={item.enabled ? "true" : ""}/>
                <div className="adminPageHeader"><div><strong>{item.title || item.label || item.itemKey || "Item da seção"}</strong><p><span className="adminCode">{item.itemKey || "item"}</span></p></div></div>
                <div className="adminFormGrid">
                  <label>Título<input name="title" defaultValue={item.title}/></label>
                  <label>Subtítulo<input name="subtitle" defaultValue={item.subtitle}/></label>
                  <label className="full">Texto<textarea name="body" defaultValue={item.body}/></label>
                  <label>Rótulo / botão<input name="label" defaultValue={item.label}/></label>
                  <label>Link<input name="url" defaultValue={item.url}/></label>
                  <label>Mídia<select name="mediaId" defaultValue={item.mediaId || ""}><option value="">Nenhuma</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalFilename}</option>)}</select></label>
                </div>
                <button className="adminButton" type="submit">Salvar conteúdo do item</button>
              </form>
            ))}
          </section>
        );
      }) : <div className="adminEmpty">Nenhuma seção registrada para esta página. A estrutura deve ser implementada no código antes de aparecer aqui.</div>}
    </div>
  );
}
