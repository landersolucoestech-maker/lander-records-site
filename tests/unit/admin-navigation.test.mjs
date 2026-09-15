import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync("app/admin/components/admin-navigation.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { resolveAdminLocation, visibleAdminNavigation } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("admin navigation selects only the most specific real route", () => {
  const location = resolveAdminLocation("/admin/settings/lander-records", "owner", false);
  assert.equal(location.activeHref, "/admin/settings/lander-records");
  assert.equal(resolveAdminLocation("/admin/artists/new", "owner", false).activeHref, "/admin/artists");
  assert.equal(resolveAdminLocation("/admin/artists/new", "owner", false).breadcrumbs.at(-1).label, "Criar");
  assert.equal(resolveAdminLocation("/admin/artists-unrelated", "owner", false).activeHref, undefined);
});

test("viewer navigation excludes owner-only users and privileged audit", () => {
  const items = visibleAdminNavigation("viewer").flatMap((group) => group.items);
  assert.ok(items.length > 0);
  assert.ok(!items.some((item) => item.href === "/admin/users" || item.href === "/admin/audit"));
});

test("synthetic admin loaders do not expose persistent edit permissions", () => {
  for (const route of ["artists", "posts", "pages", "home", "navigation"]) {
    const page = fs.readFileSync(`app/admin/(protected)/${route}/page.tsx`, "utf8");
    assert.match(page, /canEdit=\{session\.source === "session" && session\.user\.role !== "viewer"\}/, route);
  }
});
