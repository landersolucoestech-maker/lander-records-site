import type { IconName } from "./AdminIcon";

export type AdminRole = "viewer" | "editor" | "admin" | "owner";
export type AdminNavItem = { label: string; href: string; previewHref: string; icon: IconName; minimumRole?: "admin" | "owner" };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };
const rank: Record<AdminRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

export const adminNavigation: AdminNavGroup[] = [
  { label: "", items: [{ label: "Dashboard", href: "/admin", previewHref: "/cms-preview/dashboard", icon: "dashboard" }] },
  { label: "Site", items: [
    { label: "Conteúdos", href: "/admin/posts", previewHref: "/cms-preview/posts", icon: "posts" },
    { label: "Artistas", href: "/admin/artists", previewHref: "/cms-preview/artists", icon: "artists" },
    { label: "Media Kit", href: "/admin/media", previewHref: "/cms-preview/media", icon: "media" },
  ] },
  { label: "Configurações", items: [
    { label: "Empresa", href: "/admin/settings", previewHref: "/cms-preview/settings", icon: "home" },
    { label: "Identidade do Site", href: "/admin/settings#identity", previewHref: "/cms-preview/settings#identity", icon: "media" },
    { label: "Automações", href: "/admin/settings#automations", previewHref: "/cms-preview/settings#automations", icon: "activity" },
    { label: "Segurança", href: "/admin/settings#security", previewHref: "/cms-preview/settings#security", icon: "settings" },
    { label: "Integrações", href: "/admin/settings/lander-records", previewHref: "/cms-preview/integrations", icon: "integration" },
    { label: "Usuários", href: "/admin/users", previewHref: "/cms-preview/users", icon: "users", minimumRole: "owner" },
  ] },
];

export function visibleAdminNavigation(role: AdminRole) {
  return adminNavigation
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.minimumRole || rank[role] >= rank[item.minimumRole]) }))
    .filter((group) => group.items.length);
}

function pathOnly(href: string) {
  return href.split(/[?#]/, 1)[0];
}

export function resolveAdminLocation(pathname: string, role: AdminRole, preview: boolean) {
  const root = preview ? "/cms-preview/dashboard" : "/admin";
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const canonical = normalized === "/cms-preview" ? root : normalized;
  const items = visibleAdminNavigation(role).flatMap((group) => group.items);
  const hrefFor = (item: AdminNavItem) => preview ? item.previewHref : item.href;
  const active = items
    .filter((item) => {
      const href = pathOnly(hrefFor(item));
      return canonical === href || (href !== root && canonical.startsWith(`${href}/`));
    })
    .sort((a, b) => pathOnly(hrefFor(b)).length - pathOnly(hrefFor(a)).length)[0];
  const selected = active;
  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  if (canonical !== root) breadcrumbs.push({ label: "Dashboard", href: root });
  const selectedHref = selected ? pathOnly(hrefFor(selected)) : "";
  const tail = selected ? canonical.slice(selectedHref.length).split("/").filter(Boolean) : [];
  const label = selected?.label || (canonical.split("/")[2] === "releases" ? "Lançamentos" : "Portal administrativo");
  if (tail.length && selected) {
    breadcrumbs.push({ label, href: hrefFor(selected) });
    breadcrumbs.push({ label: tail[0] === "new" ? "Criar" : tail.at(-1) === "view" ? "Consultar" : "Editar" });
  } else breadcrumbs.push({ label });
  return { activeHref: selected ? hrefFor(selected) : undefined, breadcrumbs };
}
