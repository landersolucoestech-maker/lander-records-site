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
const settingsTabs = read("app/admin/(protected)/settings/SettingsTabs.tsx");
const settingsStyles = read("app/admin/(protected)/settings/Settings.module.css");
const users = read("app/admin/(protected)/users/page.tsx");
const integrations = read("app/admin/(protected)/settings/lander-records/page.tsx");
const pagination = read("app/admin/components/AdminPagination.tsx");
const paginationStyles = read("app/admin/components/AdminPagination.module.css");

test("shared admin chrome matches the Portal Lander visual contract", () => {
  assert.match(primitives, /\.adminButton\.primary \{ background: #111827/);
  assert.match(primitives, /\.adminBadge\.live/);
  assert.match(primitives, /\.adminTabs/);
  assert.match(portalContract, /\.adminMain \.admin-toolbar/);
  assert.match(portalContract, /table:not\(\.tableview-freeform\)/);
  assert.match(portalContract, /--ui-table-row-height:48px/);
  assert.match(portalContract, /#e30613/);
});

test("sidebar exposes Configurações once while its six areas stay internal tabs", () => {
  assert.equal((navigation.match(/label: "Configurações"/g) || []).length, 1);
  assert.match(navigation, /activePrefixes: \["\/admin\/settings", "\/admin\/users"\]/);
  assert.doesNotMatch(navigation, /label: "Empresa"|label: "Identidade do Site"|label: "Automações"|label: "Segurança"|label: "Integrações"|label: "Usuários"/);
  for (const tab of ["Empresa", "Identidade do site", "Automações", "Segurança", "Integrações", "Usuários"]) assert.match(settingsTabs, new RegExp(tab));
});

test("major modules retain one contextual shell without fake global capabilities", () => {
  for (const title of ["Conteúdos", "Artistas", "Mídias", "Páginas", "Mídia Kit", "Configurações"]) {
    assert.ok(shell.includes(`title: "${title}"`), `missing contextual header for ${title}`);
  }
  assert.match(shell, /adminTopbarContextual/);
  assert.match(shell, /const showContentHeaderTools = normalizedPath === contentRoot/);
  assert.match(shell, /const showArtistHeaderTools = normalizedPath === artistsRoot/);
  assert.match(shell, /const showMediaHeaderTools = normalizedPath === mediaRoot/);
  assert.match(shell, /const showNotificationHeaderTools = showContentHeaderTools \|\| showArtistHeaderTools \|\| showMediaHeaderTools/);
  assert.match(shell, /adminNotificationButton/);
  assert.match(shell, /adminNotificationBadge/);
  assert.match(shell, /adminNotificationList/);
  assert.match(shell, /name="bell"/);
  assert.match(shell, /admin:new-artist/);
  assert.match(shell, /adminTopbarPrimaryDisabled/);
  assert.match(shell, /const canEdit = !readOnly && role !== "viewer"/);
});

test("content uses the canonical modal workflow, floating actions and Lander Records public route", () => {
  assert.match(posts, /Conteúdos cadastrados/);
  assert.match(posts, /AdminPagination/);
  assert.match(pagination, /Por página/);
  assert.match(pagination, /paginationItems/);
  assert.match(posts, /data-content-action-trigger/);
  assert.match(posts, /data-content-action-menu/);
  assert.match(posts, /positionFloatingMenu\(trigger\.getBoundingClientRect\(\), menu\.getBoundingClientRect\(\)\)/);
  assert.match(posts, /createPortal\(/);
  assert.match(posts, /function ContentViewDialog/);
  assert.match(posts, /<ReactMarkdown remarkPlugins=\{\[remarkGfm\]\}>/);
  assert.match(posts, /href=\{`\/noticias\/\$\{post\.slug\}`\}/);
  assert.doesNotMatch(posts, /<details>/);
  assert.match(postStyles, /\.viewDialog/);
  assert.match(paginationStyles, /\.pagination/);
});

test("artists keep the Portal catalog geometry with floating actions and modal view/edit", () => {
  assert.doesNotMatch(artists, /<details>/);
  assert.match(artists, /name="more"/);
  assert.match(artists, /data-artist-action-trigger/);
  assert.match(artists, /data-artist-action-menu/);
  assert.match(artists, /createPortal\(/);
  assert.match(artists, /ArtistViewDialog/);
  assert.match(artists, /ArtistEditorDialog/);
  assert.match(artists, /admin:new-artist/);
  assert.match(artists, /mode="create"/);
  assert.match(artists, /styles\.queryPanel/);
  assert.match(artists, /styles\.tableSurface/);
  assert.match(artists, /adminMetricGrid/);
  assert.match(artists, /Filtrar por função/);
  assert.match(artists, /<table className=\{styles\.artistTable\}/);
  assert.match(artists, /\/artistas\/\$\{artist\.slug\}/);
  assert.match(artistStyles, /\.artistTable th\{height:38px/);
  assert.match(artistStyles, /\.tableSurface\{overflow:hidden;border:1px solid #e1e6eb;border-radius:8px/);
  assert.match(artistStyles, /\.actionMenu\{display:grid;min-width:158px/);
  assert.match(artistFormStyles, /grid-template-columns:minmax\(360px,420px\) minmax\(0,1fr\)/);
  assert.match(artistFormStyles, /position:sticky;top:78px/);
});

test("media library keeps real server actions, permission-aware controls and pagination", () => {
  assert.match(media, /Adicionar mídia/);
  assert.match(media, /adminMetricGrid/);
  assert.match(media, /styles\.queryPanel/);
  assert.match(media, /Buscar por arquivo, URL ou texto alternativo/);
  assert.match(media, /Filtrar por tipo/);
  assert.match(media, /Filtrar por status/);
  assert.match(media, /Filtrar por origem/);
  assert.match(media, /Ordenar mídias/);
  assert.match(media, /AdminPagination/);
  assert.match(paginationStyles, /grid-template-columns:minmax\(210px,1fr\) auto minmax\(210px,1fr\)/);
  assert.match(media, /<table>/);
  assert.match(media, /canArchive/);
  assert.match(media, /canUpload/);
  assert.match(mediaPage, /archiveMedia/);
  assert.match(mediaPage, /uploadMedia/);
  assert.match(mediaPage, /const persistent = session\.source === "session"/);
  assert.match(mediaPage, /const canUpload = persistent && session\.user\.role !== "viewer"/);
  assert.match(mediaPage, /const canArchive = persistent && \(session\.user\.role === "admin" \|\| session\.user\.role === "owner"\)/);
  assert.match(mediaStyles, /\.page\{width:100%;display:grid;gap:12px\}/);
  assert.match(mediaStyles, /\.queryPanel\{display:grid/);
  assert.match(mediaStyles, /\.tableSurface\{overflow:hidden;border:1px solid #e1e6eb;border-radius:8px/);
  assert.doesNotMatch(mediaStyles, /\.toolbar\{/);
  assert.match(paginationStyles, /\.pagination/);
  assert.doesNotMatch(media, /moreAction/);
});

test("media kit keeps editor plus sticky live preview while reading existing project data", () => {
  assert.match(mediaKit, /getDb\(\)/);
  assert.match(mediaKit, /Identidade e apresentação/);
  assert.match(mediaKit, /Audiência/);
  assert.match(mediaKit, /Inventário editorial/);
  assert.match(mediaKit, /Contato comercial/);
  assert.match(mediaKit, /aria-label="Prévia visual do Mídia Kit"/);
  assert.match(mediaKit, /Dados reais disponíveis/);
  assert.match(mediaKit, /Nenhum dado real de audiência disponível/);
  assert.match(mediaKitStyles, /position:sticky/);
});

test("settings internal tabs use scoped mutations and preserve RBAC", () => {
  assert.match(settings, /data-testid="settings-manager"/);
  assert.match(settings, /updateCompanySettings/);
  assert.match(settings, /updateIdentitySettings/);
  assert.match(settings, /upsertSocialLink/);
  assert.doesNotMatch(settings, /Assuntos do formulário|upsertContactTopic|contactTopics/);
  assert.doesNotMatch(settings, /updateSiteSettings/);
  assert.match(settingsStyles, /\.page,\.settingsWorkspace\{display:grid;gap:14px/);
  assert.match(settingsStyles, /\.cardHeader\{[^}]*min-height:54px/);
  assert.match(users, /data-testid="users-manager"/);
  assert.match(users, /requireAdmin\("owner"\)/);
  assert.match(users, /createAdminUser/);
  assert.match(users, /updateAdminUser/);
  assert.match(users, /resetAdminPassword/);
  assert.match(integrations, /saveLanderRecordsIntegrationSettings/);
  assert.match(integrations, /syncLanderRecordsIntegrationsAction/);
  assert.match(integrations, /Spotify/);
  assert.match(integrations, /Soundcharts/);
});
