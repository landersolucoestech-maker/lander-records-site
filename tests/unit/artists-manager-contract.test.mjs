import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/admin/(protected)/artists/page.tsx", import.meta.url), "utf8");
const managerStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.module.css", import.meta.url), "utf8");
const formStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistForm.module.css", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("Artists manager follows the dense catalog reference without inventing unsupported domain data", () => {
  assert.match(manager, /Buscar artistas\.\.\./);
  assert.match(manager, />Status</);
  assert.match(manager, />Gênero</);
  assert.match(manager, />Ordenar por</);
  assert.match(manager, /Mais recentes/);
  assert.match(manager, /Audiência/);
  assert.match(manager, /Destaque/);
  assert.match(manager, /Última atualização/);
  assert.match(manager, /Por página/);
  assert.match(manager, /Selecionar artistas desta página/);
  assert.match(manager, /paginationItems/);
  assert.match(manager, /pageSize/);
  assert.match(manager, /admin-toolbar/);
  assert.match(manager, /tableview-surface/);
  assert.match(manager, /table-card/);
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
});

test("Artists catalog reproduces the reference geometry with compact rows and pagination", () => {
  assert.match(managerStyles, /min-height:98px/);
  assert.match(managerStyles, /height:64px/);
  assert.match(managerStyles, /width:46px;height:46px/);
  assert.match(managerStyles, /grid-template-columns:minmax\(180px,1fr\) auto minmax\(180px,1fr\)/);
  assert.match(managerStyles, /border-color:#ef233c/);
  assert.match(managerStyles, /min-width:1120px/);
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
