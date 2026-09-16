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
const adminShell = read("app/admin/components/AdminShell.tsx");
const artists = read("app/admin/(protected)/artists/ArtistManager.module.css");
const artistManager = read("app/admin/(protected)/artists/ArtistManager.tsx");
const posts = read("app/admin/(protected)/posts/NewsManager.module.css");
const postManager = read("app/admin/(protected)/posts/PostManager.tsx");
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
  assert.match(runtimeContract, /height:\s*34px\s*!important/);
  assert.match(runtimeContract, /border:\s*1px solid var\(--dashboard-border\)\s*!important/);
  assert.match(runtimeContract, /border-radius:\s*10px\s*!important/);
  assert.match(runtimeContract, /font-family:\s*Montserrat,Arial,sans-serif\s*!important/);
});

test("Artists uses the approved table-first reference rather than Dashboard KPI panels", () => {
  assert.match(artistManager, /className={`adminDashboard \$\{styles\.manager\}`}/);
  assert.match(artistManager, /adminDashboardHeading/);
  assert.match(artistManager, /adminPrimaryCompact/);
  assert.match(artistManager, /styles\.tableSurface/);
  assert.doesNotMatch(artistManager, /adminMetricGrid|adminMetricCard|adminMetricSpark|adminDashboardPanel|adminAnalyticsPanelHeading/);
  assert.match(artists, /\.manager\{width:100%;display:grid;gap:18px\}/);
  assert.match(artists, /\.toolbar\{display:grid;[\s\S]*min-height:102px[\s\S]*background:#fff/);
  assert.match(artists, /\.artistTable th\{height:38px/);
  assert.match(artists, /\.artistTable td\{height:56px/);
  assert.match(artists, /\.identity img,\.avatarFallback\{[\s\S]*width:42px;height:42px[\s\S]*border-radius:6px/);
  assert.match(artists, /\.statusBadge\{[\s\S]*min-height:22px[\s\S]*border-radius:7px/);
  assert.match(artists, /approved Artists reference/);
});

test("Contents matches the approved publication-list reference rather than KPI panels", () => {
  assert.match(postManager, /data-testid="news-manager"/);
  assert.match(postManager, /Publicações/);
  assert.match(postManager, /Modo de desenvolvimento liberado/);
  assert.match(postManager, /<th>Página<\/th>/);
  assert.match(postManager, /<span className=\{styles\.pageLabel\}>Notícias<\/span>/);
  assert.match(postManager, /<th>Slug<\/th>/);
  assert.match(postManager, /Página <strong>\{safePage\}<\/strong> de/);
  assert.match(postManager, /Por página/);
  assert.doesNotMatch(postManager, /adminMetricGrid|adminMetricCard|Publicações cadastradas|Colaborações recebidas|adminAnalyticsPanelHeading/);
  assert.match(posts, /\.viewTabs\{[\s\S]*min-height:46px[\s\S]*background:#fff/);
  assert.match(posts, /\.notice\{[\s\S]*min-height:64px[\s\S]*border-left:3px solid #ff2733/);
  assert.match(posts, /\.tableSurface\{[\s\S]*border-radius:8px[\s\S]*background:#fff/);
  assert.match(posts, /\.contentTable th\{height:34px/);
  assert.match(posts, /\.contentTable td\{height:44px/);
  assert.match(posts, /\.pagination\{[\s\S]*min-height:60px/);
  assert.match(posts, /\.published\{background:#dcf7e7;color:#078847\}/);
  assert.match(posts, /Approved Contents reference/);
});

test("New content is modal-only and cannot navigate to a standalone create page", () => {
  assert.match(adminShell, /action: \{ label: "Novo conteúdo", event: "admin:new-content" \}/);
  assert.match(adminShell, /<button aria-controls="new-content-modal" aria-haspopup="dialog"/);
  assert.match(postManager, /window\.addEventListener\("admin:new-content", openModal\)/);
  assert.match(postManager, /interceptLegacyNewContentLink/);
  assert.match(postManager, /href !== "\/admin\/posts\/new"/);
  assert.equal(fs.existsSync(new URL("../../app/admin/(protected)/posts/new/page.tsx", import.meta.url)), false);
});

test("Pages keep the shared table geometry", () => {
  assert.match(pages, /\.selectionCard,\.structureCard\{[\s\S]*border-radius:10px/);
  assert.match(pages, /\.sectionsRow\{min-height:50px/);
  assert.match(pages, /\.statusBadge\{[\s\S]*border-radius:5px/);
  assert.doesNotMatch(pages, /adminTopbarPrimary\).*display:none/);
});

test("Artists, Home, Header and Pages workbench cannot keep separate shell systems", () => {
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
