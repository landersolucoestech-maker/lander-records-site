import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const shell = read("app/admin/components/AdminShell.tsx");
const primitives = read("styles/admin/primitives.css");
const posts = read("app/admin/(protected)/posts/PostManager.tsx");
const postStyles = read("app/admin/(protected)/posts/NewsManager.module.css");
const artists = read("app/admin/(protected)/artists/ArtistManager.tsx");
const artistStyles = read("app/admin/(protected)/artists/ArtistManager.module.css");
const media = read("app/admin/(protected)/media/MediaLibrary.tsx");
const mediaStyles = read("app/admin/(protected)/media/MediaLibrary.module.css");
const mediaPage = read("app/admin/(protected)/media/page.tsx");
const mediaKit = read("app/admin/(protected)/media-kit/page.tsx");
const mediaKitStyles = read("app/admin/(protected)/media-kit/MediaKit.module.css");
const settings = read("app/admin/(protected)/settings/page.tsx");
const settingsStyles = read("app/admin/(protected)/settings/Settings.module.css");
const users = read("app/admin/(protected)/users/page.tsx");
const integrations = read("app/admin/(protected)/settings/lander-records/page.tsx");

test("shared admin chrome matches the cloned neutral visual system", () => {
  assert.match(primitives, /\.adminButton\.primary \{ background: #111827/);
  assert.match(primitives, /\.adminBadge\.live/);
  assert.match(primitives, /\.adminBadge\.draft/);
  assert.match(primitives, /\.adminTabs/);
  assert.match(primitives, /#e4e7ec|#e5e7eb/);
  assert.match(primitives, /#667085/);
});

test("major modules retain one contextual shell while cloning the reference hierarchy", () => {
  for (const title of ["Conteúdos", "Artistas", "Mídias", "Páginas", "Mídia Kit", "Configurações", "Integrações", "Usuários"]) {
    assert.ok(shell.includes(`title: "${title}"`), `missing contextual header for ${title}`);
  }
  assert.match(shell, /adminTopbarContextual/);
  assert.match(shell, /name="bell"/);
});

test("content and artists use the cloned compact toolbar, table and three-dot action menu while keeping real routes", () => {
  for (const source of [posts, artists]) {
    assert.match(source, /<details>/);
    assert.match(source, /name="more"/);
    assert.match(source, /className=\{styles\.toolbar\}/);
    assert.match(source, /className=\{styles\.tableHeader\}/);
  }
  assert.match(posts, /\/admin\/posts\/\$\{post\.id\}/);
  assert.match(posts, /\/noticias\/\$\{post\.slug\}/);
  assert.match(artists, /\/admin\/artists\/\$\{artist\.id\}/);
  assert.match(artists, /\/artistas\/\$\{artist\.slug\}/);
  assert.match(postStyles, /min-height:64px/);
  assert.match(artistStyles, /min-height:64px/);
});

test("media library mirrors the reference inline upload, table and pagination without replacing server actions", () => {
  assert.match(media, /Adicionar arquivo à biblioteca/);
  assert.match(media, /Adicionar mídia/);
  assert.match(media, /Linhas por página/);
  assert.match(media, /<table>/);
  assert.match(media, /archiveAction/);
  assert.match(media, /uploadAction/);
  assert.match(mediaPage, /archiveMedia/);
  assert.match(mediaPage, /uploadMedia/);
  assert.match(mediaStyles, /\.tableSurface/);
  assert.match(mediaStyles, /\.pagination/);
});

test("media kit clones the editor plus sticky live preview while reading the existing project data", () => {
  assert.match(mediaKit, /getDb\(\)/);
  assert.match(mediaKit, /Identidade e apresentação/);
  assert.match(mediaKit, /Inventário publicitário/);
  assert.match(mediaKit, /Newsletter e presença digital/);
  assert.match(mediaKit, /Contato comercial/);
  assert.match(mediaKit, /LIVE PREVIEW/);
  assert.match(mediaKit, /Nenhum dado real de audiência disponível/);
  assert.match(mediaKitStyles, /position:sticky/);
});

test("settings, users and integrations clone the reference organization while preserving actual mutations and RBAC", () => {
  assert.match(settings, /updateSiteSettings/);
  assert.match(settings, /upsertSocialLink/);
  assert.match(settings, /upsertContactTopic/);
  for (const tab of ["Empresa", "Identidade do Site", "Automações", "Segurança", "Integrações", "Usuários"]) assert.match(settings, new RegExp(tab));
  assert.match(settingsStyles, /gap:24px/);
  assert.match(settingsStyles, /min-height:66px/);

  assert.match(users, /requireAdmin\("owner"\)/);
  assert.match(users, /createAdminUser/);
  assert.match(users, /updateAdminUser/);
  assert.match(users, /resetAdminPassword/);
  assert.match(users, /Gerenciar Equipe/);
  assert.match(users, /Papéis e Permissões/);

  assert.match(integrations, /saveLanderRecordsIntegrationSettings/);
  assert.match(integrations, /syncLanderRecordsIntegrationsAction/);
  assert.match(integrations, /Spotify/);
  assert.match(integrations, /Soundcharts/);
});
