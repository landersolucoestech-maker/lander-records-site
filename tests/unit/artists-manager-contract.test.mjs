import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.tsx", import.meta.url), "utf8");
const managerStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.module.css", import.meta.url), "utf8");
const formStyles = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistForm.module.css", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("Artists manager keeps real placement logic inside the Portal Lander catalog pattern", () => {
  assert.match(manager, /homePosition/);
  assert.match(manager, /Buscar artista por nome, gênero ou slug/);
  assert.match(manager, /admin-toolbar/);
  assert.match(manager, /tableview-surface/);
  assert.match(manager, /table-card/);
  assert.match(manager, /<table>/);
  assert.match(managerStyles, /height:64px/);
  assert.doesNotMatch(manager, /Importar CSV|Configurar módulo|Mais filtros|deleteArtistAction|Soundcharts/);
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
