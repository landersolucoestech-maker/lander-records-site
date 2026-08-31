export const NAVIGATION_MENU_KEYS = ["primary", "footer"] as const;
export const NAVIGATION_LINK_TYPES = ["internal", "external"] as const;

export type NavigationMenuKey = (typeof NAVIGATION_MENU_KEYS)[number];
export type NavigationLinkType = (typeof NAVIGATION_LINK_TYPES)[number];

export type NavigationHierarchyInput = {
  currentMenuKey?: string | null;
  hasChildren: boolean;
  itemId?: string | null;
  menuKey: string;
  parent: { id: string; menuKey: string; parentId: string | null } | null;
  parentId: string | null;
};

export const INTERNAL_NAVIGATION_DESTINATIONS = [
  { label: "Home", url: "/" },
  { label: "Sobre Nós", url: "/sobre-nos" },
  { label: "Metodologia", url: "/sobre-nos#metodologia" },
  { label: "Artistas", url: "/artistas" },
  { label: "Notícias", url: "/noticias" },
  { label: "Contato", url: "/contato" },
  { label: "Política de Privacidade", url: "/politica-de-privacidade" },
  { label: "Termos e Condições", url: "/termos-e-condicoes" },
] as const;

export function isNavigationMenuKey(value: string): value is NavigationMenuKey {
  return NAVIGATION_MENU_KEYS.includes(value as NavigationMenuKey);
}

export function isNavigationLinkType(value: string): value is NavigationLinkType {
  return NAVIGATION_LINK_TYPES.includes(value as NavigationLinkType);
}

export function navigationDestinationError(linkType: NavigationLinkType, value: string) {
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return "invalid_url";
  if (linkType === "internal") {
    if (!value.startsWith("/") || value.startsWith("//")) return "invalid_internal_url";
    try {
      const parsed = new URL(value, "https://landerrecords.local");
      return parsed.origin === "https://landerrecords.local" ? null : "invalid_internal_url";
    } catch {
      return "invalid_internal_url";
    }
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? null : "invalid_external_url";
  } catch {
    return "invalid_external_url";
  }
}

export function navigationHierarchyError({ currentMenuKey, hasChildren, itemId, menuKey, parent, parentId }: NavigationHierarchyInput) {
  if (hasChildren && (parentId || (currentMenuKey && currentMenuKey !== menuKey))) return "invalid_hierarchy";
  if (!parentId) return null;
  if (!parent || parent.id === itemId || parent.menuKey !== menuKey || parent.parentId) return "invalid_hierarchy";
  return null;
}

export function navigationDeletionError(hasChildren: boolean) {
  return hasChildren ? "delete_children" : null;
}

export function normalizeNavigationNewTab(linkType: NavigationLinkType, requested: boolean) {
  return linkType === "external" && requested;
}

export function navigationEmptyMessage(catalogSize: number) {
  return catalogSize > 0 ? "Nenhum item encontrado para os filtros selecionados." : "Nenhum item de navegação cadastrado.";
}

export function menuLabel(menuKey: string) {
  if (menuKey === "primary") return "Menu principal";
  if (menuKey === "footer") return "Rodapé";
  return `Menu não suportado: ${menuKey}`;
}
