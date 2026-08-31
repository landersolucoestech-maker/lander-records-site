import { and, asc, count, eq, ilike, inArray, notInArray, or, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { pageSections, pages } from "../../../../lib/db/schema";
import PageManager, { type PageSummary } from "./PageManager";
import { knownPageKeys, pageContract } from "./page-contract";

export const dynamic = "force-dynamic";
type PageFilters = { q?: string; status?: string; type?: string };

const typeKeys: Record<string, string[]> = { structural: ["home"], institutional: ["about"], domain: ["artists", "news"], functional: ["contact"] };

export default async function PagesAdminPage({ searchParams }: { searchParams: Promise<PageFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const filters = await searchParams;
  const conditions: SQL[] = [];
  const query = filters.q?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(or(ilike(pages.title, pattern), ilike(pages.slug, pattern), ilike(pages.key, pattern))!);
  }
  if (filters.status === "enabled") conditions.push(eq(pages.enabled, true));
  if (filters.status === "disabled") conditions.push(eq(pages.enabled, false));
  if (filters.type && typeKeys[filters.type]) conditions.push(inArray(pages.key, typeKeys[filters.type]));
  if (filters.type === "administrative") conditions.push(notInArray(pages.key, knownPageKeys));

  const [rows, sectionCounts, [metrics]] = await Promise.all([
    db.select({ id: pages.id, key: pages.key, title: pages.title, slug: pages.slug, enabled: pages.enabled, seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, updatedAt: pages.updatedAt })
      .from(pages).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(pages.title)),
    db.select({ pageId: pageSections.pageId, total: count(), enabled: sql<number>`count(*) FILTER (WHERE ${pageSections.enabled} = true)` }).from(pageSections).groupBy(pageSections.pageId),
    db.select({ total: count(), enabled: sql<number>`count(*) FILTER (WHERE ${pages.enabled} = true)`, disabled: sql<number>`count(*) FILTER (WHERE ${pages.enabled} = false)`, seoIncomplete: sql<number>`count(*) FILTER (WHERE ${pages.seoTitle} = '' OR ${pages.seoDescription} = '')` }).from(pages),
  ]);
  const summary: PageSummary[] = rows.map((page) => {
    const contract = pageContract(page.key);
    const counts = sectionCounts.find(({ pageId }) => pageId === page.id);
    const configuredRoute = page.slug ? `/${page.slug}` : "/";
    return {
      id: page.id, key: page.key, title: page.title, configuredRoute,
      publicRoute: contract.route, classification: contract.classification, scope: contract.scope,
      routeWarning: contract.route ? configuredRoute !== contract.route : true,
      enabled: page.enabled, seoConfigured: Boolean(page.seoTitle && page.seoDescription),
      sectionCount: counts?.total || 0, enabledSectionCount: counts?.enabled || 0,
      updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(page.updatedAt),
    };
  });
  return <PageManager canEdit={session.user.role !== "viewer"} initialFilters={filters} metrics={metrics} pages={summary} />;
}
