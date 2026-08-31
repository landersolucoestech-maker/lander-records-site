import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { navigationItems } from "../../../../lib/db/schema";
import { isNavigationLinkType, navigationDestinationError } from "../../navigation-contract";
import NavigationManager, { type NavigationSummary } from "./NavigationManager";

export const dynamic = "force-dynamic";
type NavigationFilters = { error?: string; hierarchy?: string; menu?: string; q?: string; saved?: string; status?: string; type?: string };

const errorMessages: Record<string, string> = {
  invalid_item: "O item informado não existe ou não é válido.",
  invalid_label: "Informe um rótulo visível com até 160 caracteres.",
  invalid_menu: "O menu informado não é suportado.",
  invalid_type: "O tipo de link informado não é suportado.",
  invalid_url: "Informe um destino válido.",
  invalid_internal_url: "Links internos devem começar com / e permanecer neste site.",
  invalid_external_url: "Links externos devem utilizar uma URL HTTPS válida.",
  invalid_position: "Informe uma posição entre 0 e 9999.",
  invalid_hierarchy: "A hierarquia é inválida. Pai e filho devem pertencer ao mesmo menu e somente um nível é permitido.",
  delete_children: "Remova ou reassocie os subitens antes de excluir este item.",
};

function stableSort(items: Array<typeof navigationItems.$inferSelect>) {
  return [...items].sort((a, b) => a.menuKey.localeCompare(b.menuKey) || a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
}

function summarize(items: Array<typeof navigationItems.$inferSelect>): NavigationSummary[] {
  const sorted = stableSort(items);
  const byId = new Map(sorted.map((item) => [item.id, item]));
  const children = new Map<string, Array<typeof navigationItems.$inferSelect>>();
  for (const item of sorted) if (item.parentId) children.set(item.parentId, [...(children.get(item.parentId) || []), item]);
  const visited = new Set<string>();
  const result: NavigationSummary[] = [];
  const visit = (item: typeof navigationItems.$inferSelect, depth: number, ancestry: Set<string>, inheritedIssue: string | null = null) => {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    const parent = item.parentId ? byId.get(item.parentId) : null;
    const issues = inheritedIssue ? [inheritedIssue] : [];
    if (item.parentId && !parent) issues.push("Pai não encontrado; item exibido com segurança.");
    else if (parent && parent.menuKey !== item.menuKey) issues.push("Pai pertence a outro menu; vínculo inválido.");
    else if (depth > 1) issues.push("Profundidade acima do nível suportado pelo CMS.");
    const safeDestination = isNavigationLinkType(item.linkType) && !navigationDestinationError(item.linkType, item.url);
    if (!safeDestination) issues.push("Tipo e destino são incompatíveis ou inseguros.");
    if (item.linkType === "internal" && item.newTab) issues.push("Nova aba não é aplicada a links internos pelo frontend atual.");
    result.push({ ...item, parentLabel: parent?.label || null, depth, childCount: children.get(item.id)?.length || 0, issue: issues.length ? issues.join(" ") : null, safeDestination });
    const nextAncestry = new Set(ancestry).add(item.id);
    for (const child of stableSort(children.get(item.id) || [])) {
      if (nextAncestry.has(child.id)) {
        if (!visited.has(child.id)) visit(child, depth + 1, nextAncestry, "Ciclo de hierarquia detectado.");
        continue;
      }
      visit(child, depth + 1, nextAncestry);
    }
  };
  const roots = sorted.filter((item) => !item.parentId || !byId.has(item.parentId) || byId.get(item.parentId)?.menuKey !== item.menuKey);
  for (const root of roots) visit(root, 0, new Set());
  for (const remaining of sorted) if (!visited.has(remaining.id)) visit(remaining, 0, new Set(), "Ciclo de hierarquia detectado; item isolado.");
  return result;
}

export default async function NavigationPage({ searchParams }: { searchParams: Promise<NavigationFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const filters = await searchParams;
  const allItems = await db.select().from(navigationItems).orderBy(asc(navigationItems.menuKey), asc(navigationItems.position), asc(navigationItems.createdAt), asc(navigationItems.id));
  const items = summarize(allItems);
  const needle = filters.q?.trim().toLocaleLowerCase("pt-BR") || "";
  const filtered = items.filter((item) => (!needle || `${item.label} ${item.url}`.toLocaleLowerCase("pt-BR").includes(needle)) && (!filters.status || filters.status === "all" || (filters.status === "active" ? item.enabled : !item.enabled)) && (!filters.type || filters.type === "all" || item.linkType === filters.type) && (!filters.menu || filters.menu === "all" || item.menuKey === filters.menu) && (!filters.hierarchy || filters.hierarchy === "all" || (filters.hierarchy === "root" ? !item.parentId : Boolean(item.parentId))));
  const metrics = { total: items.length, active: items.filter((item) => item.enabled).length, inactive: items.filter((item) => !item.enabled).length, external: items.filter((item) => item.linkType === "external").length };
  const message = filters.error ? { kind: "error" as const, text: errorMessages[filters.error] || "A operação não pôde ser concluída." } : filters.saved ? { kind: "success" as const, text: filters.saved === "deleted" ? "Item de navegação excluído." : "Item de navegação salvo." } : null;
  return <NavigationManager allItems={items} canDelete={session.user.role === "admin" || session.user.role === "owner"} canEdit={session.user.role !== "viewer"} initialFilters={filters} items={filtered} message={message} metrics={metrics} />;
}
