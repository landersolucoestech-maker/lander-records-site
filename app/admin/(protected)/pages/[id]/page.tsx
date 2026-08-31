import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { pageSectionItems, pageSections, pages } from "../../../../../lib/db/schema";
import { updatePageSection, updatePageSectionItem } from "../../../actions";
import { pageContract } from "../page-contract";

export const dynamic = "force-dynamic";
type SectionField = "eyebrow" | "title" | "subtitle" | "body";
type ItemField = "title" | "subtitle" | "body" | "label" | "url";

const sectionNames: Record<string, string> = { hero: "Hero", intro: "Apresentação", shortcuts: "Atalhos", artists: "Artistas em destaque", releases: "Últimos lançamentos", news: "Últimas notícias", history: "História", identity: "Identidade", companies: "Empresas do grupo", methodology: "Metodologia", artist_filters: "Filtros de artistas", artist_list: "Lista de artistas", news_categories: "Categorias de notícias", news_list: "Lista de notícias" };
const sectionFields: Record<string, SectionField[]> = {
  hero: ["eyebrow", "title", "subtitle"], intro: ["eyebrow", "title", "body"], artists: ["title", "subtitle"], releases: ["title"], news: ["eyebrow", "title"],
  history: ["eyebrow", "title", "subtitle", "body"], identity: ["eyebrow", "title"], companies: ["eyebrow", "title", "subtitle"], methodology: ["eyebrow", "title", "subtitle"],
};
const itemFields: Record<string, ItemField[]> = {
  hero: ["title", "label", "url"], intro: ["title", "label", "url"], shortcuts: ["title", "label", "url"], releases: ["label", "url"],
  identity: ["title", "body"], methodology: ["title", "body"], companies: ["title", "subtitle", "body", "label"],
};
const fieldLabels: Record<SectionField | ItemField, string> = { eyebrow: "Chamada curta", title: "Título", subtitle: "Subtítulo", body: "Texto", label: "Rótulo / botão", url: "Link" };

function preservedSectionFields(section: typeof pageSections.$inferSelect, visible: SectionField[]) {
  return (["eyebrow", "title", "subtitle", "body"] as SectionField[]).filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={section[field]} />);
}

function preservedItemFields(item: typeof pageSectionItems.$inferSelect, visible: ItemField[]) {
  return (["title", "subtitle", "body", "label", "url"] as ItemField[]).filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={item[field]} />);
}

export default async function PageContentEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("editor");
  const { id } = await params;
  const db = getDb();
  const [pageRows, sections] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.position)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();
  const items = sections.length ? await db.select().from(pageSectionItems).where(inArray(pageSectionItems.sectionId, sections.map((section) => section.id))).orderBy(asc(pageSectionItems.position)) : [];
  const publicRoute = pageContract(page.key).route;

  return <div className="adminPage">
    <header className="adminPageHeader"><div><h1>{page.title}</h1><p>Edite os campos que correspondem diretamente aos componentes públicos já implementados.</p></div><div className="adminActions">{publicRoute ? <Link className="adminButton" href={publicRoute} rel="noopener noreferrer" target="_blank">Ver página pública</Link> : null}<Link className="adminButton" href="/admin/pages">Voltar</Link></div></header>
    {sections.length ? sections.map((section) => {
      const visibleSectionFields = sectionFields[section.sectionKey] || [];
      const visibleItemFields = itemFields[section.sectionKey] || [];
      const sectionItems = items.filter((item) => item.sectionId === section.id);
      return <section className="adminPanel adminStack" key={section.id}>
        <div className="adminPageHeader"><div><h2>{sectionNames[section.sectionKey] || section.title || "Seção de conteúdo"}</h2><p>{section.enabled ? "Seção ativa no conteúdo CMS" : "Seção desativada no conteúdo CMS"}</p></div></div>
        {visibleSectionFields.length ? <form action={updatePageSection} className="adminForm adminSectionCard">
          <input type="hidden" name="id" value={section.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={section.position}/><input type="hidden" name="enabled" value={section.enabled ? "true" : ""}/>{preservedSectionFields(section, visibleSectionFields)}
          <div className="adminFormGrid">{visibleSectionFields.map((field) => <label className={field === "eyebrow" ? undefined : "full"} key={field}>{fieldLabels[field]}{field === "eyebrow" ? <input name={field} defaultValue={section[field]} /> : <textarea name={field} defaultValue={section[field]} />}</label>)}</div>
          <button className="adminButton primary" type="submit">Salvar conteúdo da seção</button>
        </form> : <div className="adminEmpty">Esta seção não possui campos editoriais compatíveis neste editor.</div>}
        {sectionItems.map((item) => visibleItemFields.length ? <form action={updatePageSectionItem} className="adminForm adminSectionCard" key={item.id}>
          <input type="hidden" name="id" value={item.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="itemKey" value={item.itemKey}/><input type="hidden" name="position" value={item.position}/><input type="hidden" name="enabled" value={item.enabled ? "true" : ""}/><input type="hidden" name="mediaId" value={item.mediaId || ""}/>{preservedItemFields(item, visibleItemFields)}
          <div className="adminPageHeader"><div><strong>{item.title || item.label || "Item de conteúdo"}</strong><p>{item.enabled ? "Item ativo" : "Item desativado"}</p></div></div>
          <div className="adminFormGrid">{visibleItemFields.map((field) => <label className={field === "body" ? "full" : undefined} key={field}>{fieldLabels[field]}{field === "body" ? <textarea name={field} defaultValue={item[field]} /> : <input name={field} defaultValue={item[field]} />}</label>)}</div>
          <button className="adminButton" type="submit">Salvar conteúdo do item</button>
        </form> : null)}
      </section>;
    }) : <div className="adminEmpty">Nenhuma seção registrada para esta página. A estrutura precisa de um componente público antes de ser editável aqui.</div>}
  </div>;
}
