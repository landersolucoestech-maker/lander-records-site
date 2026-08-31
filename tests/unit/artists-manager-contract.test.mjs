import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(new URL("../../app/admin/(protected)/artists/ArtistManager.tsx", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("Artists manager uses the canonical placement and omits unsupported mock features", () => {
  assert.match(manager, /homePosition/);
  assert.match(manager, /Buscar artista por nome, gênero ou slug/);
  assert.doesNotMatch(manager, /Importar CSV|Configurar módulo|Mais filtros|deleteArtistAction|Soundcharts/);
});

test("Artists preview remains fixture-only and exposes no write primitive", () => {
  assert.match(preview, /previewArtists/);
  assert.doesNotMatch(preview, /artist-actions|saveArtistAction|deleteArtistAction/);
});
