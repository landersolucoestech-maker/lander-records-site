import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/admin/(protected)/artists/page.tsx", import.meta.url), "utf8");
const managerStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.module.css", import.meta.url), "utf8");
const formStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistForm.module.css", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("Artists manager uses the Dashboard visual hierarchy without inventing unsupported domain data", () => {
  assert.match(manager, /adminDashboard/);
  assert.match(manager, /adminDashboardHeading/);
  assert.match(manager, /adminMetricGrid/);
  assert.match(manager, /adminMetricCard/);
  assert.match(manager, /adminMetricSpark/);
  assert.match(manager, /adminDashboardPanel/);
  assert.match(manager, /adminAnalyticsPanelHeading/);
  assert.match(manager, /adminPanelHeadingIdentity/);
  assert.match(manager, /adminPrimaryCompact/);
  assert.match(manager, /Gerencie o casting, a publicação e os destaques da Lander Records/);
  assert.match(manager, /Catálogo de artistas/);
  assert.match(manager, /Buscar artistas\.\.\./);
  assert.match(manager, />Status</);
  assert.match(manager, />Gênero</);
  assert.match(manager, />Ordenar por</);
  assert.match(manager, /Mais recentes/);
  assert.match(manager, /Audiência/);
  assert.match(manager, /Destaques na Home/);
  assert.match(manager, /Última atualização/);
  assert.match(manager, /Por página/);
  assert.match(manager, /Selecionar artistas desta página/);
  assert.match(manager, /paginationItems/);
  assert.match(manager, /pageSize/);
  assert.doesNotMatch(manager, /Lançamentos|Visualizações/);
  assert.doesNotMatch(manager, /Importar CSV|Configurar módulo|Mais filtros|deleteArtistAction/);
});

test("Artists catalog surfaces real roles, metrics and Home placement from persistence", () => {
  assert.match(page, /artistRoleRelations/);
  assert.match(page, /artistRoles/);
  assert.match(page, /artistMetrics/);
  assert.match(page, /metricsByArtist/);
  assert.match(page, /Math\.max\(metrics\.get\(row\.platform\) \|\| 0, row\.value \|\| 0\)/);
  assert.match(page, /audience/);
  assert.match(page, /home_artists/);
  assert.match(page, /updatedAt: artist\.updatedAt\.toISOString\(\)/);
  assert.match(manager, /artist\.roles/);
  assert.match(manager, /artist\.audience/);
  assert.match(manager, /artist\.homePosition/);
  assert.match(manager, /publishedCount = artists\.filter/);
  assert.match(manager, /homeFeaturedCount = artists\.filter/);
  assert.match(manager, /audienceTotal = artists\.reduce/);
});

test("Artists catalog reproduces the real Dashboard density, cards and pagination", () => {
  assert.match(managerStyles, /\.manager\{width:100%;display:grid;gap:14px\}/);
  assert.match(managerStyles, /\.toolbar\{display:grid;[\s\S]*padding:12px 14px;[\s\S]*background:#fafbfc/);
  assert.match(managerStyles, /\.toolbar input,\.toolbar select\{[\s\S]*height:34px;[\s\S]*border:1px solid #e1e6eb;[\s\S]*font-family:Montserrat,Arial,sans-serif/);
  assert.match(managerStyles, /\.artistTable th\{height:34px/);
  assert.match(managerStyles, /\.artistTable td\{height:50px/);
  assert.match(managerStyles, /\.identity img,\.avatarFallback\{[\s\S]*width:38px;height:38px[\s\S]*border-radius:50%/);
  assert.match(managerStyles, /grid-template-columns:minmax\(180px,1fr\) auto minmax\(180px,1fr\)/);
  assert.match(managerStyles, /\.paginationControls \.activePage\{border-color:#e30613/);
  assert.match(managerStyles, /min-width:1050px/);
  assert.match(managerStyles, /\.panelSummary\{display:flex;align-items:center/);
  assert.match(managerStyles, /\.statusBadge\{[\s\S]*min-height:20px[\s\S]*border-radius:5px/);
});

test("Artists editor uses the Portal workbench proportions without changing artist persistence", () => {
  assert.match(formStyles, /grid-template-columns:minmax\(360px,420px\) minmax\(0,1fr\)/);
  assert.match(formStyles, /position:sticky;top:78px/);
  assert.match(formStyles, /border-radius:8px/);
  assert.match(formStyles, /accent-color:#e30613/);
});

test("Artists preview remains fixture-only and exposes no write primitive", () => {
  assert.match(preview, /previewArtists/);
  assert.doesNotMatch(preview, /artist-actions|saveArtistAction|deleteArtistAction/);
});
