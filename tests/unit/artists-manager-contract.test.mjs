import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/admin/(protected)/artists/page.tsx", import.meta.url), "utf8");
const managerStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.module.css", import.meta.url), "utf8");
const formStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistForm.module.css", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("Artists manager matches the approved table-first reference structure", () => {
  assert.match(manager, /adminDashboardHeading/);
  assert.match(manager, /Gerencie os artistas do seu selo, edite informações, discografia e conteúdos relacionados/);
  assert.match(manager, /Novo artista/);
  assert.match(manager, /styles\.tableSurface/);
  assert.match(manager, /Buscar artistas\.\.\./);
  assert.match(manager, />Status</);
  assert.match(manager, />Gênero</);
  assert.match(manager, />Ordenar por</);
  assert.match(manager, /Mais recentes/);
  assert.match(manager, /Lançamentos/);
  assert.match(manager, /Visualizações/);
  assert.match(manager, /Última atualização/);
  assert.match(manager, /Por página/);
  assert.match(manager, /Selecionar artistas desta página/);
  assert.match(manager, /paginationItems/);
  assert.match(manager, /pageSize/);
  assert.doesNotMatch(manager, /adminMetricGrid|adminMetricCard|adminMetricSpark|adminDashboardPanel|adminAnalyticsPanelHeading|Catálogo de artistas|Destaques na Home/);
  assert.doesNotMatch(manager, /Importar CSV|Configurar módulo|Mais filtros|deleteArtistAction/);
});

test("Artists catalog surfaces real roles, release counts and real view metrics", () => {
  assert.match(page, /artistRoleRelations/);
  assert.match(page, /artistRoles/);
  assert.match(page, /artistMetrics/);
  assert.match(page, /metricsByArtist/);
  assert.match(page, /Math\.max\(metrics\.get\(row\.platform\) \|\| 0, row\.value \|\| 0\)/);
  assert.match(page, /releases\.artistName/);
  assert.match(page, /eq\(releases\.active, true\)/);
  assert.match(page, /releasesByArtistName/);
  assert.match(page, /releaseCount:/);
  assert.match(page, /integrationMetricCache/);
  assert.match(page, /VIEW_METRICS/);
  assert.match(page, /viewsByArtist/);
  assert.match(page, /views,/);
  assert.match(page, /updatedAt: artist\.updatedAt\.toISOString\(\)/);
  assert.match(manager, /artist\.roles/);
  assert.match(manager, /artist\.releaseCount/);
  assert.match(manager, /artist\.views/);
  assert.doesNotMatch(manager, /artist\.audience/);
});

test("Artists table reproduces the approved reference density and pagination", () => {
  assert.match(managerStyles, /\.manager\{width:100%;display:grid;gap:18px\}/);
  assert.match(managerStyles, /\.tableSurface\{[\s\S]*border-radius:10px[\s\S]*background:#fff/);
  assert.match(managerStyles, /\.toolbar\{display:grid;[\s\S]*min-height:102px[\s\S]*padding:20px 18px 24px/);
  assert.match(managerStyles, /\.artistTable th\{height:38px/);
  assert.match(managerStyles, /\.artistTable td\{height:56px/);
  assert.match(managerStyles, /\.identity img,\.avatarFallback\{[\s\S]*width:42px;height:42px[\s\S]*border-radius:6px/);
  assert.match(managerStyles, /grid-template-columns:minmax\(210px,1fr\) auto minmax\(210px,1fr\)/);
  assert.match(managerStyles, /\.paginationControls \.activePage\{border-color:#ef2731/);
  assert.match(managerStyles, /min-width:1120px/);
  assert.match(managerStyles, /\.statusBadge\{[\s\S]*min-height:22px[\s\S]*border-radius:7px/);
  assert.match(managerStyles, /approved Artists reference/);
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
