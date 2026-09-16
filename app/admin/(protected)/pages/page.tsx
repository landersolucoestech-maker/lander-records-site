import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { pageSections, pages } from "../../../../lib/db/schema";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import PageManager, { type PageSummary } from "./PageManager";
import { pageContract } from "./page-contract";

export const dynamic = "force-dynamic";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div></article>;
}

export default async function PagesAdminPage() {
  const session = await requireAdmin();
  const db = getDb();
  const [rows, sections] = await Promise.all([
    db.select({ id: pages.id, key: pages.key, title: pages.title, slug: pages.slug, enabled: pages.enabled, seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, updatedAt: pages.updatedAt }).from(pages).orderBy(asc(pages.title)),
    db.select({ id: pageSections.id, pageId: pageSections.pageId, sectionKey: pageSections.sectionKey, type: pageSections.type, position: pageSections.position, enabled: pageSections.enabled, title: pageSections.title, subtitle: pageSections.subtitle }).from(pageSections).orderBy(asc(pageSections.position)),
  ]);

  const summary: PageSummary[] = rows.map((page) => {
    const contract = pageContract(page.key);
    const configuredRoute = page.slug ? `/${page.slug}` : "/";
    const pageStructure = sections.filter((section) => section.pageId === page.id).map(({ pageId: _pageId, ...section }) => section);
    return {
      id: page.id, key: page.key, title: page.title, configuredRoute, publicRoute: contract.route, classification: contract.classification, scope: contract.scope,
      routeWarning: contract.route ? configuredRoute !== contract.route : true, enabled: page.enabled, seoConfigured: Boolean(page.seoTitle && page.seoDescription),
      sectionCount: pageStructure.length, enabledSectionCount: pageStructure.filter((section) => section.enabled).length,
      updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(page.updatedAt), sections: pageStructure,
    };
  });
  const enabledPages = summary.filter((page) => page.enabled).length;
  const totalSections = summary.reduce((total, page) => total + page.sectionCount, 0);
  const enabledSections = summary.reduce((total, page) => total + page.enabledSectionCount, 0);

  return <div className="adminDashboard">
    <header className="adminDashboardHeading"><div><h1>Páginas</h1><p>Gerencie a estrutura pública da Lander Records usando o mesmo sistema visual e hierarquia do Dashboard.</p></div></header>
    <section className="adminMetricGrid" aria-label="Resumo das páginas">
      <Metric accent="red" icon="pages" label="Páginas" value={summary.length} hint="estruturas administráveis" />
      <Metric accent="green" icon="check" label="Publicadas" value={enabledPages} hint="habilitadas no CMS" />
      <Metric accent="blue" icon="sliders" label="Seções" value={totalSections} hint="blocos cadastrados" />
      <Metric accent="orange" icon="eye" label="Seções ativas" value={enabledSections} hint="blocos habilitados" />
    </section>
    <PageManager canEdit={session.source === "session" && session.user.role !== "viewer"} demoMode={session.source === "development-auth-bypass"} pages={summary} />
  </div>;
}
