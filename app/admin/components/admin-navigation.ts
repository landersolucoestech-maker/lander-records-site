import type { IconName } from "./AdminIcon";

export type AdminRole = "viewer" | "editor" | "admin" | "owner";
export type AdminNavItem = { label: string; href: string; previewHref: string; icon: IconName; minimumRole?: "admin" | "owner" };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };
const rank: Record<AdminRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };
export const adminNavigation: AdminNavGroup[] = [
  { label: "Visão geral", items: [{ label: "Dashboard", href: "/admin", previewHref: "/cms-preview/dashboard", icon: "dashboard" }] },
  { label: "Conteúdo", items: [
    { label: "Home", href: "/admin/home", previewHref: "/cms-preview/home", icon: "home" },
    { label: "Artistas", href: "/admin/artists", previewHref: "/cms-preview/artists", icon: "artists" },
    { label: "Notícias", href: "/admin/posts", previewHref: "/cms-preview/posts", icon: "posts" },
    { label: "Páginas", href: "/admin/pages", previewHref: "/cms-preview/pages", icon: "pages" },
    { label: "Mídia", href: "/admin/media", previewHref: "/cms-preview/media", icon: "media" },
  ] },
  { label: "Estrutura", items: [
    { label: "Navegação", href: "/admin/navigation", previewHref: "/cms-preview/navigation", icon: "navigation" },
    { label: "Cabeçalho", href: "/admin/header", previewHref: "/cms-preview/header", icon: "pages" },
  ] },
  { label: "Organização", items: [
    { label: "Categorias", href: "/admin/categories", previewHref: "/cms-preview/categories", icon: "pages" },
    { label: "Tags", href: "/admin/tags", previewHref: "/cms-preview/tags", icon: "tags" },
  ] },
  { label: "Sistema", items: [
    { label: "Configurações", href: "/admin/settings", previewHref: "/cms-preview/settings", icon: "settings" },
    { label: "Integrações", href: "/admin/settings/lander-records", previewHref: "/cms-preview/integrations", icon: "integration" },
  ] },
  { label: "Administração", items: [
    { label: "Usuários", href: "/admin/users", previewHref: "/cms-preview/users", icon: "users", minimumRole: "owner" },
    { label: "Atividade", href: "/admin/audit", previewHref: "/cms-preview/audit", icon: "audit", minimumRole: "admin" },
  ] },
];

export function visibleAdminNavigation(role: AdminRole) {
  return adminNavigation.map((group) => ({ ...group, items: group.items.filter((item) => !item.minimumRole || rank[role] >= rank[item.minimumRole]) })).filter((group) => group.items.length);
}

export function resolveAdminLocation(pathname: string, role: AdminRole, preview: boolean) {
  const root = preview ? "/cms-preview/dashboard" : "/admin";
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const canonical = normalized === "/cms-preview" ? root : normalized;
  const items = visibleAdminNavigation(role).flatMap((group) => group.items);
  const hrefFor = (item: AdminNavItem) => preview ? item.previewHref : item.href;
  const active = items.filter((item) => canonical === hrefFor(item) || (hrefFor(item) !== root && canonical.startsWith(`${hrefFor(item)}/`))).sort((a, b) => hrefFor(b).length - hrefFor(a).length)[0];
  const categoryAlias = ["artist-categories", "post-categories"].includes(canonical.split("/")[2]);
  const selected = active || (categoryAlias ? items.find((item) => item.href === "/admin/categories") : undefined);
  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  if (canonical !== root) breadcrumbs.push({ label: "Dashboard", href: root });
  const tail = selected ? canonical.slice(hrefFor(selected).length).split("/").filter(Boolean) : [];
  const label = selected?.label || (canonical.split("/")[2] === "releases" ? "Lançamentos" : "Portal administrativo");
  if (tail.length && !categoryAlias && selected) {
    breadcrumbs.push({ label, href: hrefFor(selected) });
    breadcrumbs.push({ label: tail[0] === "new" ? "Criar" : tail.at(-1) === "view" ? "Consultar" : "Editar" });
  } else breadcrumbs.push({ label });
  return { activeHref: selected ? hrefFor(selected) : undefined, breadcrumbs };
}
