import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const shell = read("app/admin/components/AdminShell.tsx");
const navigation = read("app/admin/components/admin-navigation.ts");
const primitives = read("styles/admin/primitives.css");
const portalContract = read("styles/admin/portal-lander-contract.css");
const posts = read("app/admin/(protected)/posts/PostManager.tsx");
const postStyles = read("app/admin/(protected)/posts/NewsManager.module.css");
const artists = read("app/admin/(protected)/artists/ArtistManager.tsx");
const artistStyles = read("app/admin/(protected)/artists/ArtistManager.module.css");
const artistFormStyles = read("app/admin/(protected)/artists/ArtistForm.module.css");
const media = read("app/admin/(protected)/media/MediaLibrary.tsx");
const mediaStyles = read("app/admin/(protected)/media/MediaLibrary.module.css");
const mediaPage = read("app/admin/(protected)/media/page.tsx");
const mediaKit = read("app/admin/(protected)/media-kit/page.tsx");
const mediaKitStyles = read("app/admin/(protected)/media-kit/MediaKit.module.css");
const settings = read("app/admin/(protected)/settings/page.tsx");
const settingsStyles = read("app/admin/(protected)/settings/Settings.module.css");
const users = read("app/admin/(protected)/users/page.tsx");
const integrations = read("app/admin/(protected)/settings/lander-records/page.tsx");

test("shared admin chrome matches the Portal Lander visual contract", () => {
  assert.match(primitives, /\.adminButton\.primary \{ background: #111827/);
  assert.match(primitives, /\.adminBadge\.live/);
  assert.match(primitives, /\.adminTabs/);
  assert.match(portalContract, /\.adminMain \.admin-toolbar/);
  assert.match(portalContract, /table:not\(\.tableview-freeform\)/);
  assert.match(portalContract, /--ui-table-row-height:64px/);
  assert.match(portalContract, /#e30613/);
});

test("sidebar exposes Configurações once while its six areas stay internal tabs", () => {
  assert.equal((navigation.match(/label: "Configurações"/g) || []).length, 1);
  assert.match(navigation, /activePrefixes: \["\/admin\/settings", "\/admin\/users"\]/);
  assert.doesNotMatch(navigation, /label: "Empresa"|label: "Identidade do Site"|label: "Automações"|label: "Segurança"|label: "Integrações"|label: "Usuários"/);
  for (const tab of ["Empresa", "Identidade do Site", "Automações", "Segurança", "Integrações", "Usuários"]) assert.match(settings, new RegExp(tab));
});

test("major modules retain one contextual shell without fake global capabilities", () => {
  for (const title of ["Conteúdos", "Artistas", "Mídias", "Páginas", "Mídia Kit", "Configurações"]) {
    assert.ok(shell.includes(`title: "${title}"`), `missing contextual header for ${title}`);
  }
  assert.match(shell, /adminTopbarContextual/);
  assert.doesNotMatch(shell, /adminNotificationButton/);
  assert.doesNotMatch(shell, /name="bell"/);
  assert.match(shell, /const canEdit = !readOnly && role !== "viewer"/);
});

test("content uses the canonical modal workflow, floating actions and Lander Records public route", () => {
  assert.match(posts, /Conteúdos cadastrados/);
  assert.match(posts, /Por página/);
  assert.match(posts, /Página <strong>\{safePage\}<\/strong> de/);
  assert.match(posts, /data-content-action-trigger/);
  assert.match(posts, /data-content-action-menu/);
  assert.match(posts, /positionFloatingMenu\(trigger\.getBoundingClientRect\(\), menu\.getBoundingClientRect\(\)\)/);
  assert.match(posts, /createPortal\(/);
  assert.match(posts, /function ContentViewDialog/);
  assert.match(posts, /<ReactMarkdown remarkPlugins=\{\[remarkGfm\]\}>/);
  assert.match(posts, /href=\{`\/noticias\/\$\{post\.slug\}`\}/);
  assert.doesNotMatch(posts, /<details>/);
  assert.match(postStyles, /\.viewDialog/);
  assert.match(postStyles, /\.pagination/);
});

test("artists keep real routes while sharing the Portal catalog geometry", () => {
  assert.match(artists, /<details>/);
  assert.match(artists, /name="more"/);
  assert.match(artists, /admin-toolbar/);
  assert.match(artists, /tableview-surface/);
  assert.match(artists, /table-card/);
  assert.match(artists, /<table>/);
  assert.match(artists, /\/admin\/artists\/\$\{artist\.id\}/);
  assert.match(artists, /\/artistas\/\$\{artist\.slug\}/);
  assert.match(artistStyles, /height:64px/);
  assert.match(artistFormStyles, /grid-template-columns:minmax\(360px,420px\) minmax\(0,1fr\)/);
  assert.match(artistFormStyles, /position:sticky;top:78px/);
});

test("media library keeps real server actions, permission-aware controls and pagination", () => {
  assert.match(media, /Adicionar mídia/);
  assert.match(media, /Linhas por página/);
  assert.match(media, /<table>/);
  assert.match(media, /canArchive/);
  assert.match(media, /canUpload/);
  assert.match(mediaPage, /archiveMedia/);
  assert.match(mediaPage, /uploadMedia/);
  assert.match(mediaPage, /const persistent = session\.source === "session"/);
  assert.match(mediaPage, /const canUpload = persistent && session\.user\.role !== "viewer"/);
  assert.match(mediaPage, /const canArchive = persistent && \(session\.user\.role === "admin" \|\| session\.user\.role === "owner"\)/);
  assert.match(mediaStyles, /\.tableSurface/);
  assert.match(mediaStyles, /\.pagination/);
  assert.doesNotMatch(media, /moreAction/);
});

test("media kit keeps editor plus sticky live preview while reading existing project data", () => {
  assert.match(mediaKit, /getDb\(\)/);
  assert.match(mediaKit, /Identidade e apresentação/);
  assert.match(mediaKit, /Inventário publicitário/);
  assert.match(mediaKit, /Newsletter e presença digital/);
  assert.match(mediaKit, /Contato comercial/);
  assert.match(mediaKit, /LIVE PREVIEW/);
  assert.match(mediaKit, /Nenhum dado real de audiência disponível/);
  assert.match(mediaKitStyles, /position:sticky/);
});

test("settings internal tabs use scoped mutations and preserve RBAC", () => {
  assert.match(settings, /updateCompanySettings/);
  assert.match(settings, /updateIdentitySettings/);
  assert.match(settings, /upsertSocialLink/);
  assert.match(settings, /upsertContactTopic/);
  assert.doesNotMatch(settings, /updateSiteSettings/);
  assert.match(settingsStyles, /gap:24px/);
  assert.match(settingsStyles, /min-height:66px/);
  assert.match(users, /requireAdmin\("owner"\)/);
  assert.match(users, /createAdminUser/);
  assert.match(users, /updateAdminUser/);
  assert.match(users, /resetAdminPassword/);
  assert.match(integrations, /saveLanderRecordsIntegrationSettings/);
  assert.match(integrations, /syncLanderRecordsIntegrationsAction/);
  assert.match(integrations, /Spotify/);
  assert.match(integrations, /Soundcharts/);
});
