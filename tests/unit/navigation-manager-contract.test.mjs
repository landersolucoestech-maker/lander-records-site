import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const {
  navigationDeletionError,
  navigationDestinationError,
  navigationEmptyMessage,
  navigationHierarchyError,
  normalizeNavigationNewTab,
} = await import(new URL("../../app/admin/navigation-contract.ts", import.meta.url));

const page = fs.readFileSync(new URL("../../app/admin/(protected)/navigation/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/navigation/NavigationManager.tsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../../app/admin/navigation-contract.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../../app/admin/actions.ts", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");
const chrome = fs.readFileSync(new URL("../../app/components/SiteChrome.tsx", import.meta.url), "utf8");

test("Navigation metrics and filters use real navigation fields", () => {
  for (const field of ["enabled", "linkType", "menuKey", "parentId", "position", "newTab"]) assert.match(page + manager, new RegExp(field));
  assert.match(page, /searchParams: Promise<NavigationFilters>/);
  assert.match(manager, /if \(!preview\) return items/);
  assert.doesNotMatch(manager, /Mais filtros|Publicado|Rascunho|Arquivado/);
});

test("Navigation hierarchy is deterministic and fails safely", () => {
  assert.match(page, /createdAt\.getTime\(\).*id\.localeCompare/);
  assert.match(page, /Pai não encontrado/);
  assert.match(page, /Ciclo de hierarquia detectado/);
  assert.match(manager, /Subitem de/);
  assert.match(manager, /Header, menu mobile e Footer exibem atualmente somente itens principais/);
  assert.doesNotMatch(manager, /drag|Arraste|grip/i);
});

test("Navigation destinations and menus are constrained by repository truth", () => {
  assert.match(contract, /NAVIGATION_MENU_KEYS = \["primary", "footer"\]/);
  assert.match(contract, /!parsed\.username && !parsed\.password/);
  assert.match(contract, /!value\.startsWith\("\/"\) \|\| value\.startsWith\("\/\/"\)/);
  for (const route of ["/sobre-nos", "/artistas", "/noticias", "/contato", "/politica-de-privacidade", "/termos-e-condicoes"]) assert.match(contract, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(actions, /pg_advisory_xact_lock/);
  assert.match(actions, /navigationDeletionError/);
  assert.doesNotMatch(actions + manager, /confirmCascade/);
});

test("Navigation destination validation rejects unsafe executable inputs", () => {
  for (const value of ["/", "/artistas?ordem=1", "/sobre-nos#metodologia"]) {
    assert.equal(navigationDestinationError("internal", value), null);
  }
  for (const value of ["javascript:alert(1)", "//evil.example", "https://evil.example", "/artistas\\evil", "/artistas\u0000evil"]) {
    assert.notEqual(navigationDestinationError("internal", value), null);
  }
  assert.equal(navigationDestinationError("external", "https://example.com/perfil"), null);
  for (const value of ["http://example.com", "javascript:alert(1)", "https://user:password@example.com", "not a url", "https://example.com/evil\u0007"]) {
    assert.notEqual(navigationDestinationError("external", value), null);
  }
});

test("Navigation hierarchy rejects self-parent, cross-menu, excessive depth and parent moves", () => {
  const root = { id: "root", menuKey: "primary", parentId: null };
  const base = { currentMenuKey: "primary", hasChildren: false, itemId: "item", menuKey: "primary", parent: root, parentId: "root" };
  assert.equal(navigationHierarchyError(base), null);
  assert.equal(navigationHierarchyError({ ...base, parent: { ...root, id: "item" } }), "invalid_hierarchy");
  assert.equal(navigationHierarchyError({ ...base, parent: { ...root, menuKey: "footer" } }), "invalid_hierarchy");
  assert.equal(navigationHierarchyError({ ...base, parent: { ...root, parentId: "ancestor" } }), "invalid_hierarchy");
  assert.equal(navigationHierarchyError({ ...base, hasChildren: true }), "invalid_hierarchy");
  assert.equal(navigationHierarchyError({ ...base, hasChildren: true, menuKey: "footer", parent: null, parentId: null }), "invalid_hierarchy");
});

test("Navigation deletion is fail-closed for parents", () => {
  assert.equal(navigationDeletionError(false), null);
  assert.equal(navigationDeletionError(true), "delete_children");
});

test("Navigation internal links cannot persist an unsupported new-tab promise", () => {
  assert.equal(normalizeNavigationNewTab("internal", true), false);
  assert.equal(normalizeNavigationNewTab("external", true), true);
  assert.equal(normalizeNavigationNewTab("external", false), false);
  assert.match(actions, /newTab: normalizeNavigationNewTab\(linkType as "internal" \| "external", checked\(formData, "newTab"\)\)/);
  assert.match(manager, /disabled=\{linkType === "internal"\}/);
});

test("Navigation empty state distinguishes an empty catalog from a filtered result", () => {
  assert.equal(navigationEmptyMessage(0), "Nenhum item de navegação cadastrado.");
  assert.equal(navigationEmptyMessage(12), "Nenhum item encontrado para os filtros selecionados.");
  assert.match(manager, /navigationEmptyMessage\(sourceItems\.length\)/);
});

test("Navigation editor remounts when switching records so uncontrolled values cannot bleed", () => {
  assert.match(manager, /<NavigationForm[^>]+key=\{editor === "new" \? "new" : editor\.id\}/);
});

test("Public consumers still expose only root items and no public redesign", () => {
  assert.match(chrome, /menuKey === "primary" && !item\.parentId/);
  assert.match(chrome, /menuKey === "footer" && !item\.parentId/);
  assert.match(chrome, /Quero Contratar/);
});

test("Navigation preview reuses the real manager without persistence", () => {
  assert.match(preview, /previewNavigation/);
  assert.match(preview, /<NavigationManager items=\{previewNavigation\} preview/);
  assert.doesNotMatch(preview, /upsertNavigationItem|deleteNavigationItem/);
  assert.match(manager, /BACKEND_ENVIRONMENT_DEFERRED/);
  assert.match(manager, /disabled type="button">.*Novo item de menu/);
});
