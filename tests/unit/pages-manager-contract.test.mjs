import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const page = read("app/admin/(protected)/pages/page.tsx");
const manager = read("app/admin/(protected)/pages/PageManager.tsx");
const styles = read("app/admin/(protected)/pages/PagesManager.module.css");
const shell = read("app/admin/components/AdminShell.tsx");
const shellStyles = read("styles/admin/shell.css");
const routeContract = read("app/admin/(protected)/pages/page-contract.ts");
const siteContract = read("app/admin/(protected)/pages/site-page-contract.ts");
const pageActions = read("app/admin/page-actions.ts");
const editorPage = read("app/admin/(protected)/pages/[id]/page.tsx");
const workbench = read("app/admin/(protected)/pages/[id]/PageContentWorkbench.tsx");
const workbenchStyles = read("app/admin/(protected)/pages/[id]/PageContentWorkbench.module.css");
const home = read("app/(public)/page.tsx");
const about = read("app/(public)/sobre-nos/page.tsx");
const artists = read("app/(public)/artistas/page.tsx");
const news = read("app/(public)/noticias/page.tsx");
const contact = read("app/(public)/contato/page.tsx");
const privacy = read("app/(public)/politica-de-privacidade/page.tsx");
const terms = read("app/(public)/termos-e-condicoes/page.tsx");
const sitemap = read("app/sitemap.ts");
const repository = read("modules/pages/repository.ts");
const migration = read("migrations/0012_lander_site_cms_alignment.sql");
const releaseMigration = read("migrations/0013_home_latest_releases_playlist.sql");
const integrationSettings = read("app/admin/(protected)/settings/lander-records/page.tsx");
const sync = read("lib/integrations/sync.ts");
const spotify = read("lib/integrations/spotify.ts");

test("Pages overview mirrors the Portal Lander composition while keeping Lander Records data", () => {
  for (const copy of ["Página selecionada", "Estrutura da página", "Criar seção", "Ver página pública", "Editar", "Excluir", "Seção", "Status", "Ações", "Configurar"]) {
    assert.match(manager, new RegExp(copy, "i"));
  }
  assert.match(manager, /sitePageContract/);
  assert.match(manager, /siteSectionContract/);
  assert.match(manager, /\?section=\$\{encodeURIComponent\(section\.id\)\}/);
  assert.doesNotMatch(manager, /Estrutura vinculada ao site/);
  assert.doesNotMatch(manager, /moreButton|AdminIcon name="more"/);
  assert.doesNotMatch(manager, /referencePages|referenceSections|demoMode \|\| preview \?/);
  assert.doesNotMatch(manager, /Mais Lidas|Publicidade Lateral|Em Alta|Newsletter|Sobre o Portal/);
  assert.match(page, /sections: pageStructure/);
  assert.doesNotMatch(page, /adminDashboardHeading/);
  assert.match(manager, /className=\{styles\.selectionMain\}/);
  assert.match(manager, /className=\{styles\.sectionsList\} role="table"/);
  assert.match(manager, /className=\{styles\.sectionsHead\} role="row"/);
  assert.match(manager, /className=\{styles\.sectionsRow\}/);
  assert.doesNotMatch(manager, /<table>/);
  assert.match(styles, /\.selectionCard\{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:12px 14px;margin-bottom:14px\}/);
  assert.match(styles, /\.selectionMain\{display:flex;align-items:flex-end;gap:16px;min-width:0\}/);
  assert.match(styles, /\.sectionsHead,\.sectionsRow\{display:grid;grid-template-columns:minmax\(360px,1fr\) 120px minmax\(150px,auto\)/);
  assert.match(styles, /\.sectionsRow\{min-height:50px;padding:6px 14px;border-bottom:1px solid #eef1f4\}/);
  assert.match(styles, /\.sectionActions\{display:flex;gap:7px;justify-content:flex-end/);
  assert.doesNotMatch(styles, /overflow-x:auto/);
});

test("Pages overview does not offer arbitrary page creation without a public renderer", () => {
  assert.doesNotMatch(manager, /createPageAction|Criar página de conteúdo|Criar rascunho|create-page-form/);
  assert.doesNotMatch(pageActions, /export async function createPageAction/);
  assert.match(routeContract, /route: null, classification: "Estrutura administrativa" as const, scope: "Sem renderer público registrado"/);
  assert.doesNotMatch(sitemap, /from\(pages\)|getPageContent/);
  assert.match(manager, /Esta estrutura não possui renderer público registrado/);
});

test("Canonical page and section map comes from the Lander Records public implementation", () => {
  assert.match(siteContract, /sectionOrder: \["hero", "intro", "shortcuts", "artists", "releases", "advertise_banner", "news"\]/);
  assert.match(siteContract, /sectionOrder: \["hero", "history", "identity", "methodology", "companies"\]/);
  assert.match(siteContract, /sectionOrder: \["hero", "artist_filters", "artist_list"\]/);
  assert.match(siteContract, /sectionOrder: \["hero", "news_categories", "news_list"\]/);
  assert.match(siteContract, /privacy:[\s\S]*route: "\/politica-de-privacidade"/);
  assert.match(siteContract, /terms:[\s\S]*route: "\/termos-e-condicoes"/);
  assert.doesNotMatch(siteContract, /most_read|latest_news|side_ad|trending|newsletter/);
  assert.doesNotMatch(siteContract, /pillars:/);
  assert.match(routeContract, /SITE_PAGE_CONTRACTS/);
  assert.match(routeContract, /sitePageContract/);
});

test("Every Home CMS section maps to a real Lander Records consumer", () => {
  for (const key of ["hero", "intro", "shortcuts", "artists", "releases", "advertise_banner", "news"]) {
    assert.match(home, new RegExp(`sectionByKey\\(content, ["']${key}["']\\)`));
  }
  assert.match(home, /hero\.items\.map/);
  assert.match(home, /shortcuts\.items\.map/);
  assert.match(home, /getPublishedArtists\(true\)/);
  assert.match(home, /getHomeSpotifyReleaseFeed\(\)/);
  assert.match(home, /getPublishedPosts\(true\)/);
  assert.match(home, /advertiseBanner\?\.mediaUrl/);
  assert.match(repository, /mediaUrl:/);
  assert.match(repository, /mediaAltText:/);
  assert.doesNotMatch(home, /src="\/lander-records-anuncie-banner\.webp"/);
});

test("Últimos Lançamentos is directly below Artistas and is exclusively playlist driven", () => {
  assert.match(siteContract, /sectionOrder: \["hero", "intro", "shortcuts", "artists", "releases", "advertise_banner", "news"\]/);
  assert.match(siteContract, /releases: section\([\s\S]*"Últimos Lançamentos"[\s\S]*\["title", "subtitle"\],[\s\S]*\[\],[\s\S]*Spotify playlist/);
  assert.match(siteContract, /nenhum lançamento é cadastrado manualmente no CMS/i);
  assert.match(releaseMigration, /section_key = 'artists'[\s\S]*position = 5[\s\S]*section_key = 'releases'/);
  assert.match(releaseMigration, /title = 'Últimos Lançamentos'/);
  assert.match(releaseMigration, /DELETE FROM page_section_items[\s\S]*section_key = 'releases'/);
  assert.match(integrationSettings, /Playlist da seção “Últimos Lançamentos”/);
  assert.match(integrationSettings, /exibe no máximo 5 faixas/);
  assert.match(home, /spotifyFeed\.releases\.slice\(0, 5\)/);
  assert.match(home, /release\.coverUrl/);
  assert.match(home, /release\.title/);
  assert.match(home, /release\.artistName/);
  assert.match(home, /releaseDateLabel\(release\.releaseDate\)/);
  assert.match(home, /spotifyFeed\.playlistUrl/);
});

test("Spotify feed accepts fewer than five tracks and refreshes the Home automatically", () => {
  assert.match(spotify, /\.slice\(0, 5\)/);
  assert.match(spotify, /title = track\.name\?\.trim\(\)/);
  assert.match(spotify, /safePublicSpotifyUrl\(track\.external_urls\?\.spotify, "track"\)/);
  assert.doesNotMatch(sync, /são necessários pelo menos 5/);
  assert.match(sync, /if \(result\.releases\.length\)/);
  assert.match(sync, /getHomeSpotifyReleaseFeed/);
  assert.match(sync, /refreshDue/);
  assert.match(sync, /syncSpotifyReleases\(false\)/);
  assert.match(sync, /limit\(5\)/);
});

test("Other public pages and domain sections match the CMS contract", () => {
  for (const key of ["hero", "history", "identity", "methodology", "companies"]) assert.match(about, new RegExp(`byKey\\(["']${key}["']\\)`));
  assert.doesNotMatch(about, /byKey\(["']pillars["']\)/);
  assert.match(artists, /sectionKey === "artist_filters"/);
  assert.match(artists, /sectionKey === "artist_list"/);
  assert.match(news, /sectionKey === "news_categories"/);
  assert.match(news, /sectionKey === "news_list"/);
  assert.match(contact, /getContactTopics/);
  assert.match(contact, /getSiteChrome/);
});

test("Hero and section editor expose only Lander Records fields and preview the real public route", () => {
  assert.match(editorPage, /siteSectionContract/);
  assert.match(editorPage, /mediaAssets/);
  assert.match(editorPage, /const session = await requireAdmin\("editor"\)/);
  assert.doesNotMatch(editorPage, /if \(session\.source !== "session"\) redirect\("\/admin\/pages"\)/);
  assert.match(workbench, /data-site-source="lander-records"/);
  assert.match(workbench, /siteSectionContract\(page\.key, selected\.sectionKey\)/);
  assert.match(workbench, /CTAs do Hero/);
  assert.match(workbench, /Somente itens realmente consumidos pelo frontend público/);
  assert.match(workbench, /updatePageSection/);
  assert.match(workbench, /addPageSectionItem/);
  assert.match(workbench, /updatePageSectionItem/);
  assert.match(workbench, /deletePageSectionItem/);
  assert.match(workbench, /<iframe/);
  assert.match(workbench, /src=\{publicRoute\}/);
  assert.match(workbench, /Preview público real/);
  assert.match(workbench, /name="monitor"/);
  assert.match(workbench, /name="tablet"/);
  assert.match(workbench, /name="smartphone"/);
  assert.doesNotMatch(workbench, /PortalPagePreview|LANDER RECORDS · EM DESTAQUE|EXPLORAR DESTAQUES|className=\{styles\.ticker\}/);
  assert.match(workbenchStyles, /grid-template-columns:minmax\(350px,390px\) minmax\(0,1fr\)/);
  assert.match(workbenchStyles, /overflow-y:scroll/);
});

test("Previously hardcoded public content is migrated into the CMS", () => {
  assert.match(migration, /advertise_banner/);
  assert.match(migration, /lander-records-anuncie-banner\.webp/);
  assert.match(migration, /DELETE FROM page_sections[\s\S]*section_key = 'pillars'/);
  assert.match(migration, /'privacy'/);
  assert.match(migration, /'terms'/);
  assert.match(migration, /'legal_body'/);
  assert.match(migration, /1\. Quem somos/);
  assert.match(migration, /13\. Contato/);
  assert.match(privacy, /getPageContent\("privacy"\)/);
  assert.match(privacy, /legalBody\.items\.map/);
  assert.match(terms, /getPageContent\("terms"\)/);
  assert.match(terms, /legalBody\.items\.map/);
});

test("Portal Lander remains an admin UX reference, not a content source", () => {
  assert.match(shell, /adminAdministrationLabel/);
  assert.match(shell, />ADMINISTRAÇÃO</);
  assert.match(shell, /adminHeaderBack/);
  assert.match(shellStyles, /--admin-sidebar-width: 238px/);
  assert.match(shellStyles, /--admin-header-height: 68px/);
  assert.match(shellStyles, /background: #050505/);
  assert.doesNotMatch(manager, /Portal Lander/);
  assert.doesNotMatch(workbench, /PortalPagePreview|LANDER RECORDS · EM DESTAQUE|EXPLORAR DESTAQUES|Mais Lidas|Publicidade Lateral/);
});
