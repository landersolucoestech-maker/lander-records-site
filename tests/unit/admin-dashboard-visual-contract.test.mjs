import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const entry = read("app/admin/dashboard.css");
const dashboard = read("styles/admin/dashboard.css");
const contract = read("styles/admin/dashboard-module-contract.css");
const featureOverrides = read("styles/admin/dashboard-feature-overrides.css");
const runtimeContract = read("styles/admin/dashboard-runtime-contract.css");
const portalContract = read("styles/admin/portal-lander-contract.css");
const artists = read("app/admin/(protected)/artists/ArtistManager.module.css");
const posts = read("app/admin/(protected)/posts/NewsManager.module.css");
const pages = read("app/admin/(protected)/pages/PagesManager.module.css");

test("Dashboard contracts load after the shared protected-admin styles", () => {
  const dashboardImport = entry.indexOf('@import "../../styles/admin/dashboard.css"');
  const contractImport = entry.indexOf('@import "../../styles/admin/dashboard-module-contract.css"');
  const featureImport = entry.indexOf('@import "../../styles/admin/dashboard-feature-overrides.css"');
  const runtimeImport = entry.indexOf('@import "../../styles/admin/dashboard-runtime-contract.css"');
  assert.notEqual(dashboardImport, -1);
  assert.notEqual(contractImport, -1);
  assert.notEqual(featureImport, -1);
  assert.notEqual(runtimeImport, -1);
  assert.ok(contractImport > dashboardImport, "Dashboard module contract must load after shared admin CSS");
  assert.ok(featureImport > contractImport, "Feature normalization must load after the shared Dashboard contract");
  assert.ok(runtimeImport > featureImport, "Runtime contract must be the final protected-admin CSS authority");
  assert.match(entry, /Final authority: every protected module resolves to the Dashboard design language/);
});

test("shared module tokens are derived from the real Dashboard, not an approximation", () => {
  assert.match(dashboard, /\.adminDashboard\s*\{[^}]*gap:\s*14px/);
  assert.match(dashboard, /\.adminDashboardHeading h1\s*\{[^}]*font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\)/);
  assert.match(dashboard, /\.adminDashboardHeading h1\s*\{[^}]*color:\s*#101114/);
  assert.match(dashboard, /\.adminDashboardHeading p\s*\{[^}]*color:\s*#52637a/);
  assert.match(dashboard, /border:\s*1px solid #e1e6eb/);
  assert.match(dashboard, /border-radius:\s*10px/);

  assert.match(contract, /--ui-page-gap:\s*14px/);
  assert.match(contract, /--ui-border:\s*#e1e6eb/);
  assert.match(contract, /--ui-radius-lg:\s*10px/);
  assert.match(contract, /--ui-text-strong:\s*#101114/);
  assert.match(contract, /--ui-control-md:\s*34px/);
  assert.match(contract, /font-family:\s*'Montserrat', Arial, sans-serif/);
  assert.match(contract, /font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\) !important/);
});

test("runtime contract does not depend on webpack/turbopack CSS-module hash formatting", () => {
  assert.match(runtimeContract, /\[class\*="toolbar" i\]/);
  assert.match(runtimeContract, /\[class\*="tableSurface" i\]/);
  assert.match(runtimeContract, /\[class\*="catalogFrame" i\]/);
  assert.match(runtimeContract, /\[class\*="selectionCard" i\]/);
  assert.match(runtimeContract, /\[class\*="structureCard" i\]/);
  assert.match(runtimeContract, /\[class\*="statusBadge" i\]/);
  assert.doesNotMatch(runtimeContract, /_toolbar__/);
  assert.doesNotMatch(runtimeContract, /_card__/);
});

test("all protected tables, controls, filters and cards resolve through the Dashboard contract", () => {
  assert.match(runtimeContract, /table:not\(\.tableview-freeform\) th/);
  assert.match(runtimeContract, /table:not\(\.tableview-freeform\) td/);
  assert.match(runtimeContract, /height:\s*34px !important/);
  assert.match(runtimeContract, /border:\s*1px solid var\(--dashboard-border\) !important/);
  assert.match(runtimeContract, /border-radius:\s*var\(--dashboard-radius\) !important/);
  assert.match(runtimeContract, /font-family:\s*Montserrat, Arial, sans-serif !important/);
});

test("high-traffic managers use Dashboard values in their own CSS instead of relying on a global illusion", () => {
  assert.match(artists, /\.toolbar\{[\s\S]*min-height:72px[\s\S]*padding:10px 12px 12px/);
  assert.match(artists, /\.tableCard td\{[\s\S]*height:50px/);
  assert.match(artists, /\.identity img,\.avatarFallback\{[\s\S]*width:38px;height:38px/);
  assert.match(artists, /\.statusBadge\{[\s\S]*min-height:20px[\s\S]*border-radius:5px/);

  assert.match(posts, /\.tableSurface\{[\s\S]*border-radius:10px[\s\S]*#10182808/);
  assert.match(posts, /\.published\{background:#dcf7e7;color:#078847\}/);
  assert.doesNotMatch(posts, /adminTopbarPrimary/);

  assert.match(pages, /\.selectionCard,\.structureCard\{[\s\S]*border-radius:10px/);
  assert.match(pages, /\.sectionsRow\{min-height:50px/);
  assert.match(pages, /\.statusBadge\{[\s\S]*border-radius:5px/);
  assert.doesNotMatch(pages, /adminTopbarPrimary\).*display:none/);
});

test("Artists, Home, Header and Pages workbench cannot keep separate visual systems", () => {
  assert.match(featureOverrides, /\[data-testid="artist-manager"\]/);
  assert.match(featureOverrides, /\.homeManager \{/);
  assert.match(featureOverrides, /\.homeSectionCard \{/);
  assert.match(featureOverrides, /\[data-testid="header-manager"\]/);
  assert.match(featureOverrides, /\[data-testid="page-section-workbench"\]/);
  assert.match(featureOverrides, /border:\s*1px solid #e1e6eb !important/);
  assert.match(featureOverrides, /border-radius:\s*10px !important/);
});

test("legacy Portal contract can provide geometry but no longer wins the final visual cascade", () => {
  assert.match(portalContract, /Portal Lander/);
  assert.ok(entry.indexOf("dashboard-module-contract.css") > entry.indexOf("dashboard.css"));
  assert.ok(entry.indexOf("dashboard-feature-overrides.css") > entry.indexOf("dashboard-module-contract.css"));
  assert.ok(entry.indexOf("dashboard-runtime-contract.css") > entry.indexOf("dashboard-feature-overrides.css"));
});
