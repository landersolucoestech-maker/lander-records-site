import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync("app/admin/components/admin-navigation.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { resolveAdminLocation, visibleAdminNavigation } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function walk(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? walk(target) : [target.replaceAll("\\", "/")];
  });
}

test("admin navigation exposes settings as one sidebar module", () => {
  const groups = visibleAdminNavigation("owner");
  assert.deepEqual(groups.map((group) => group.module?.label || group.label), ["", "Site", ""]);
  assert.deepEqual(groups.flatMap((group) => group.items.map((item) => item.label)), [
    "Dashboard",
    "Conteúdos",
    "Artistas",
    "Mídias",
    "Páginas",
    "Mídia Kit",
    "Configurações",
  ]);
  const forbiddenSidebarItems = ["Empresa", "Identidade do Site", "Automações", "Segurança", "Integrações", "Usuários"];
  assert.ok(forbiddenSidebarItems.every((label) => !groups.flatMap((group) => group.items).some((item) => item.label === label)));
  const site = groups.find((group) => group.module?.label === "Site");
  assert.ok(site);
  assert.deepEqual(site.items.map((item) => item.href), ["/admin/posts", "/admin/artists", "/admin/media", "/admin/pages", "/admin/media-kit"]);
});

test("admin navigation selects the most specific real route", () => {
  assert.equal(resolveAdminLocation("/admin/settings/lander-records", "owner", false).activeHref, "/admin/settings");
  assert.equal(resolveAdminLocation("/admin/users", "owner", false).activeHref, "/admin/settings");
  assert.equal(resolveAdminLocation("/admin/artists/new", "owner", false).activeHref, "/admin/artists");
  assert.equal(resolveAdminLocation("/admin/artists/new", "owner", false).breadcrumbs.at(-1).label, "Criar");
  assert.equal(resolveAdminLocation("/admin/media-kit", "owner", false).activeHref, "/admin/media-kit");
  assert.equal(resolveAdminLocation("/admin/artists-unrelated", "owner", false).activeHref, undefined);
});

test("settings internal tabs keep Configurações active in the sidebar", () => {
  for (const location of [
    "/admin/settings",
    "/admin/settings#identity",
    "/admin/settings#automations",
    "/admin/settings#security",
    "/admin/settings/lander-records",
    "/admin/users",
  ]) assert.equal(resolveAdminLocation(location, "owner", false).activeHref, "/admin/settings", location);

  for (const location of [
    "/cms-preview/settings",
    "/cms-preview/settings#identity",
    "/cms-preview/integrations",
    "/cms-preview/users",
  ]) assert.equal(resolveAdminLocation(location, "owner", true).activeHref, "/cms-preview/settings", location);
});

test("viewer sidebar still exposes only the Configurações entry, not privileged internal tabs", () => {
  const items = visibleAdminNavigation("viewer").flatMap((group) => group.items);
  assert.ok(items.some((item) => item.label === "Configurações"));
  assert.ok(!items.some((item) => item.href === "/admin/users"));
});

test("synthetic admin loaders do not expose persistent edit permissions", () => {
  for (const route of ["artists", "posts", "pages", "home", "navigation"]) {
    const page = fs.readFileSync(`app/admin/(protected)/${route}/page.tsx`, "utf8");
    assert.match(page, /canEdit=\{session\.source === "session" && session\.user\.role !== "viewer"\}/, route);
  }
});

test("protected admin routes render resolved modules without route loading boundaries or lazy module imports", () => {
  const files = walk("app/admin/(protected)");
  assert.deepEqual(files.filter((file) => file.endsWith("/loading.tsx")), []);
  for (const file of files.filter((item) => /\.(?:ts|tsx)$/.test(item))) {
    const contents = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(contents, /from\s+["']next\/dynamic["']|React\.lazy\s*\(|\blazy\s*\(\s*\(\)\s*=>|<Suspense\b/, file);
  }
});
