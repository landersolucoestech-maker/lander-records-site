import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const shell = read("app/admin/components/AdminShell.tsx");
const primitives = read("styles/admin/primitives.css");
const posts = read("app/admin/(protected)/posts/PostManager.tsx");
const artists = read("app/admin/(protected)/artists/ArtistManager.tsx");
const media = read("app/admin/(protected)/media/MediaLibrary.tsx");
const mediaPage = read("app/admin/(protected)/media/page.tsx");
const mediaKit = read("app/admin/(protected)/media-kit/page.tsx");
const settings = read("app/admin/(protected)/settings/page.tsx");
const dialog = read("app/admin/components/AdminDialog.tsx");

test("shared admin system uses neutral surfaces, black primary actions and restrained semantic color", () => {
  assert.match(primitives, /\.adminButton\.primary \{ background: #111827/);
  assert.match(primitives, /\.adminBadge\.live/);
  assert.match(primitives, /\.adminBadge\.draft/);
  assert.match(primitives, /\.adminDialogBackdrop/);
  assert.match(primitives, /\.adminTabs/);
});

test("major modules use shared contextual headers instead of duplicating page chrome", () => {
  for (const title of ["Conteúdos", "Artistas", "Mídias", "Páginas", "Mídia Kit", "Configurações", "Integrações", "Usuários"]) {
    assert.match(shell, new RegExp(`title: \\"${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\"`));
  }
  assert.match(shell, /adminTopbarContextual/);
  assert.match(shell, /name="bell"/);
});

test("content and artists remain real catalog flows while adopting the table-first reference language", () => {
  assert.match(posts, /Conteúdo/);
  assert.match(posts, /Categoria/);
  assert.match(posts, /Slug/);
  assert.match(posts, /StatusBadge/);
  assert.doesNotMatch(posts, /Total de notícias|Notícias publicadas|Atalhos do módulo/);
  assert.match(artists, /Ordenar por/);
  assert.match(artists, /Artista/);
  assert.match(artists, /Gênero/);
  assert.match(artists, /StatusBadge/);
  assert.doesNotMatch(artists, /Total de artistas|Em destaque na Home/);
});

test("media library uses the shared accessible dialog and existing server actions", () => {
  assert.match(media, /AdminDialog/);
  assert.match(media, /Enviar mídia/);
  assert.match(media, /archiveAction/);
  assert.match(mediaPage, /archiveMedia/);
  assert.match(mediaPage, /uploadMedia/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /openerRef\.current\?\.focus/);
});

test("media kit and settings do not invent replacement business domains", () => {
  assert.match(mediaKit, /getDb\(\)/);
  assert.match(mediaKit, /Nenhum dado real de audiência disponível/);
  assert.match(mediaKit, /versionamento ainda não persistido/);
  assert.match(settings, /updateSiteSettings/);
  assert.match(settings, /upsertSocialLink/);
  assert.match(settings, /upsertContactTopic/);
  for (const tab of ["Empresa", "Identidade do Site", "Automações", "Segurança", "Integrações", "Usuários"]) assert.match(settings, new RegExp(tab));
});
