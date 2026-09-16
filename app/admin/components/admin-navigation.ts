import type { IconName } from "./AdminIcon";

export type AdminRole = "viewer" | "editor" | "admin" | "owner";
export type AdminNavItem = {
  label: string;
  href: string;
  previewHref: string;
  icon: IconName;
  minimumRole?: "admin" | "owner";
  activePrefixes?: string[];
  previewActivePrefixes?: string[];
};
export type AdminNavModule = { label: string; icon: IconName };
export type AdminNavGroup = { key: string; label: string; items: AdminNavItem[]; module?: AdminNavModule };
const rank: Record<AdminRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

export const adminNavigation: AdminNavGroup[] = [
  { key: "primary", label: "", items: [{ label: "Dashboard", href: "/admin", previewHref: "/cms-preview/dashboard", icon: "dashboard" }] },
  {
    key: "site",
    label: "",
    module: { label: "Site", icon: "home" },
    items: [
      { label: "Conteúdos", href: "/admin/posts", previewHref: "/cms-preview/posts", icon: "posts" },
      { label: "Artistas", href: "/admin/artists", previewHref: "/cms-preview/artists", icon: "artists" },
      { label: "Mídias", href: "/admin/media", previewHref: "/cms-preview/media", icon: "media" },
      { label: "Páginas", href: "/admin/pages", previewHref: "/cms-preview/pages", icon: "pages" },
      { label: "Mídia Kit", href: "/admin/media-kit", previewHref: "/cms-preview/media-kit", icon: "media" },
    ],
  },
  {
    key: "settings",
    label: "",
    items: [{
      label: "Configurações",
      href: "/admin/settings",
      previewHref: "/cms-preview/settings",
      icon: "settings",
      activePrefixes: ["/admin/settings", "/admin/users"],
      previewActivePrefixes: ["/cms-preview/settings", "/cms-preview/integrations", "/cms-preview/users"],
    }],
  },
];

export function visibleAdminNavigation(role: AdminRole) {
  return adminNavigation
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.minimumRole || rank[role] >= rank[item.minimumRole]) }))
    .filter((group) => group.items.length);
}

function hrefParts(href: string) {
  const [path, hash = ""] = href.split("#", 2);
  return { path: path.split("?", 1)[0], hash: hash ? `#${hash}` : "" };
}

export function resolveAdminLocation(locationValue: string, role: AdminRole, preview: boolean) {
  const root = preview ? "/cms-preview/dashboard" : "/admin";
  const [pathnameValue, hashValue = ""] = locationValue.split("#", 2);
  const currentHash = hashValue ? `#${hashValue}` : "";
  const normalized = pathnameValue.replace(/\/+$/, "") || "/";
  const canonical = normalized === "/cms-preview" ? root : normalized;
  const items = visibleAdminNavigation(role).flatMap((group) => group.items);
  const hrefFor = (item: AdminNavItem) => preview ? item.previewHref : item.href;
  const prefixesFor = (item: AdminNavItem) => preview ? item.previewActivePrefixes : item.activePrefixes;
  const prefixMatches = (prefix: string) => canonical === prefix || (prefix !== root && canonical.startsWith(`${prefix}/`));
  const specificity = (item: AdminNavItem) => Math.max(...((prefixesFor(item) || [hrefParts(hrefFor(item)).path]).map((prefix) => prefix.length)));

  const active = items
    .filter((item) => {
      const prefixes = prefixesFor(item);
      if (prefixes?.some(prefixMatches)) return true;
      const parts = hrefParts(hrefFor(item));
      if (canonical === parts.path) {
        if (parts.hash) return parts.hash === currentHash;
        return true;
      }
      return !parts.hash && parts.path !== root && canonical.startsWith(`${parts.path}/`);
    })
    .sort((a, b) => specificity(b) - specificity(a))[0];

  const selected = active;
  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  if (canonical !== root) breadcrumbs.push({ label: "Dashboard", href: root });
  const selectedPath = selected ? hrefParts(hrefFor(selected)).path : "";
  const ownsCanonicalPath = Boolean(selectedPath) && (canonical === selectedPath || canonical.startsWith(`${selectedPath}/`));
  const settingsArea = selected?.label === "Configurações";
  const tail = selected && ownsCanonicalPath && !settingsArea ? canonical.slice(selectedPath.length).split("/").filter(Boolean) : [];
  const label = selected?.label || (canonical.split("/")[2] === "releases" ? "Lançamentos" : "Portal administrativo");
  if (tail.length && selected) {
    breadcrumbs.push({ label, href: hrefFor(selected) });
    breadcrumbs.push({ label: tail[0] === "new" ? "Criar" : tail.at(-1) === "view" ? "Consultar" : "Editar" });
  } else breadcrumbs.push({ label });
  return { activeHref: selected ? hrefFor(selected) : undefined, breadcrumbs };
}
