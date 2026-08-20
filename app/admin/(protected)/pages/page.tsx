import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { pageSections, pages } from "../../../../lib/db/schema";
import PageManager, { type PageSummary } from "./PageManager";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const db = getDb();
  const [rows, sections] = await Promise.all([
    db.select().from(pages).orderBy(asc(pages.title)),
    db.select().from(pageSections).orderBy(asc(pageSections.position)),
  ]);
  const summary: PageSummary[] = rows.map((page) => ({
    id: page.id,
    title: page.title,
    route: page.slug ? `/${page.slug}` : "/",
    enabled: page.enabled,
    sections: sections.filter((section) => section.pageId === page.id).map((section) => section.sectionKey),
    seoConfigured: Boolean(page.seoTitle && page.seoDescription),
    updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(page.updatedAt),
  }));
  const { deleted } = await searchParams;

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SITE</p><h1>Páginas e Seções</h1><p>Gerencie páginas, rotas, seções identificadas, SEO e status sem alterar a estrutura visual do frontend público.</p></div></header>
      <PageManager pages={summary} deleted={deleted === "1"} />
    </div>
  );
}
