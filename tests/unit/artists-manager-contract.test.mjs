import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const manager = read("app/admin/(protected)/artists/ArtistManager.tsx");
const page = read("app/admin/(protected)/artists/page.tsx");
const editPage = read("app/admin/(protected)/artists/[id]/page.tsx");
const newPage = read("app/admin/(protected)/artists/new/page.tsx");
const managerStyles = read("app/admin/(protected)/artists/ArtistManager.module.css");
const pagination = read("app/admin/components/AdminPagination.tsx");
const paginationStyles = read("app/admin/components/AdminPagination.module.css");
const formStyles = read("app/admin/(protected)/artists/ArtistForm.module.css");
const preview = read("app/cms-preview/AdminPreview.tsx");

test("Artists manager matches the approved table-first reference structure without fake bulk actions", () => {
  assert.doesNotMatch(manager, /adminDashboardHeading/);
  assert.doesNotMatch(manager, /Gerencie os artistas do seu selo, edite informações, discografia e conteúdos relacionados/);
  assert.doesNotMatch(manager, /Novo artista/);
  assert.match(manager, /styles\.tableSurface/);
  assert.match(manager, /Buscar artistas\.\.\./);
  assert.match(manager, /className="srOnly">Status<\/span>/);
  assert.match(manager, /className="srOnly">Gênero<\/span>/);
  assert.match(manager, /className="srOnly">Ordenar por<\/span>/);
  assert.match(manager, /Mais recentes/);
  assert.match(manager, /Visualizações/);
  assert.match(manager, /Última atualização/);
  assert.match(manager, /AdminPagination/);
  assert.match(manager, /pageSize/);
  assert.match(pagination, /Por página/);
  assert.match(pagination, /paginationItems/);
  assert.doesNotMatch(manager, /Selecionar artistas desta página|Selecionar \$\{artist\.name\}|selected|toggleCurrentPage|toggleArtist/);
  assert.doesNotMatch(manager, /adminMetricGrid|adminMetricCard|adminMetricSpark|adminDashboardPanel|adminAnalyticsPanelHeading|Catálogo de artistas|Destaques na Home/);
  assert.doesNotMatch(manager, /Importar CSV|Configurar módulo|Mais filtros|deleteArtistAction/);
});

test("Artists catalog surfaces real roles and provider-backed view metrics without retired manual releases", () => {
  assert.match(page, /artistRoleRelations/);
  assert.match(page, /artistRoles/);
  assert.match(page, /artistMetrics/);
  assert.match(page, /metricsByArtist/);
  assert.match(page, /Math\.max\(metrics\.get\(row\.platform\) \|\| 0, row\.value \|\| 0\)/);
  assert.match(page, /integrationMetricCache/);
  assert.match(page, /VIEW_METRICS/);
  assert.match(page, /viewsByArtist/);
  assert.match(page, /views,/);
  assert.match(page, /updatedAt: artist\.updatedAt\.toISOString\(\)/);
  assert.match(manager, /artist\.roles/);
  assert.match(manager, /artist\.views/);
  assert.doesNotMatch(page, /\breleases\b|releasesByArtistName|releaseCount/);
  assert.doesNotMatch(manager, /Lançamentos|artist\.releaseCount/);
  assert.doesNotMatch(manager, /artist\.audience/);
});

test("Artists write routes require a persistent editor while consult remains separate", () => {
  for (const source of [editPage, newPage]) {
    assert.match(source, /requireAdmin\("editor"\)/);
    assert.match(source, /if \(session\.source !== "session"\) redirect\("\/admin\/artists"\)/);
  }
  assert.match(manager, /canEdit && !preview \? <Link href=\{`\/admin\/artists\/\$\{artist\.id\}`\}/);
  assert.match(manager, /`\/admin\/artists\/\$\{artist\.id\}\/view`/);
});

test("Artists table reproduces the approved reference density and pagination", () => {
  assert.match(managerStyles, /\.manager\{width:100%;display:grid;gap:18px\}/);
  assert.match(managerStyles, /\.tableSurface\{[\s\S]*border-radius:10px[\s\S]*background:#fff/);
  assert.match(managerStyles, /\.toolbar\{display:grid;[\s\S]*min-height:102px[\s\S]*padding:20px 18px 24px/);
  assert.match(managerStyles, /\.artistTable th\{height:38px/);
  assert.match(managerStyles, /\.artistTable td\{height:56px/);
  assert.match(managerStyles, /\.identity img,\.avatarFallback\{[\s\S]*width:42px;height:42px[\s\S]*border-radius:6px/);
  assert.match(paginationStyles, /grid-template-columns:minmax\(210px,1fr\) auto minmax\(210px,1fr\)/);
  assert.match(paginationStyles, /\.controls \.active\{border-color:#ef2731/);
  assert.match(managerStyles, /min-width:980px/);
  assert.match(managerStyles, /\.statusBadge\{[\s\S]*min-height:22px[\s\S]*border-radius:7px/);
  assert.doesNotMatch(managerStyles, /checkboxColumn/);
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
