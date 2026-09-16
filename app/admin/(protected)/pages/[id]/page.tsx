import { asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { pageSectionItems, pageSections, pages } from "../../../../../lib/db/schema";
import { AdminContextHeaderSync } from "../../../components/AdminContextHeaderSync";
import PageContentWorkbench, { type PageEditorItem, type PageEditorSection } from "./PageContentWorkbench";
import { pageContract } from "../page-contract";

export const dynamic = "force-dynamic";

const sectionNames: Record<string, string> = {
  hero: "Hero Section",
  featured: "Em Destaque",
  most_read: "Mais Lidas",
  latest_news: "Últimas Notícias",
  side_ad: "Publicidade Lateral",
  trending: "Em Alta",
  advertise: "Anuncie Aqui",
  releases: "Lançamentos",
  agenda: "Agenda",
  newsletter: "Newsletter",
  intro: "Apresentação",
  shortcuts: "Atalhos",
  artists: "Artistas em destaque",
  news: "Últimas notícias",
  history: "História",
  identity: "Identidade",
  companies: "Empresas do grupo",
  methodology: "Metodologia",
  artist_filters: "Filtros de artistas",
  artist_list: "Lista de artistas",
  news_categories: "Categorias de notícias",
  news_list: "Lista de notícias",
};

export default async function PageContentEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> }) {
  await requireAdmin("editor");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  const [pageRows, sections] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.position)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();

  const itemRows = sections.length
    ? await db.select().from(pageSectionItems).where(inArray(pageSectionItems.sectionId, sections.map((section) => section.id))).orderBy(asc(pageSectionItems.position))
    : [];

  const editorSections: PageEditorSection[] = sections.map((section) => ({
    id: section.id,
    sectionKey: section.sectionKey,
    type: section.type,
    position: section.position,
    enabled: section.enabled,
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
  }));

  const editorItems: PageEditorItem[] = itemRows.map((item) => ({
    id: item.id,
    sectionId: item.sectionId,
    itemKey: item.itemKey,
    position: item.position,
    enabled: item.enabled,
    mediaId: item.mediaId,
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    label: item.label,
    url: item.url,
  }));

  const initialSection = editorSections.find((section) => section.id === query.section) || editorSections[0];
  const initialLabel = initialSection ? sectionNames[initialSection.sectionKey] || initialSection.sectionKey.replaceAll("_", " ") : "Página";
  const headerDescription = `Configure ${initialLabel} no painel rolável à esquerda e acompanhe a página completa no preview fixo à direita.`;

  return <>
    <AdminContextHeaderSync title={`Configurar seção: ${initialLabel}`} description={headerDescription} />
    <PageContentWorkbench
      page={{ id: page.id, key: page.key, title: page.title }}
      publicRoute={pageContract(page.key).route}
      sections={editorSections}
      items={editorItems}
      initialSectionId={query.section}
    />
  </>;
}
