import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { pageSections, pages } from "../../../../lib/db/schema";
import PageManager, { type PageSummary } from "./PageManager";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
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

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div>
          <h1>Páginas & Seções</h1>
          <p>As páginas e seções são definidas no código/VS Code. O CMS edita somente o conteúdo dentro dos frames já implementados.</p>
        </div>
      </header>
      <PageManager pages={summary} />
    </div>
  );
}
