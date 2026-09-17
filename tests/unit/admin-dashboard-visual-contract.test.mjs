import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const entry = read("app/admin/dashboard.css");
const dashboard = read("styles/admin/dashboard.css");
const featureOverrides = read("styles/admin/dashboard-feature-overrides.css");
const runtimeContract = read("styles/admin/dashboard-runtime-contract.css");
const adminShell = read("app/admin/components/AdminShell.tsx");
const artists = read("app/admin/(protected)/artists/ArtistManager.module.css");
const artistManager = read("app/admin/(protected)/artists/ArtistManager.tsx");
const posts = read("app/admin/(protected)/posts/NewsManager.module.css");
const postManager = read("app/admin/(protected)/posts/PostManager.tsx");
const postsPage = read("app/admin/(protected)/posts/page.tsx");
const legacyPostRoute = read("app/admin/(protected)/posts/[id]/page.tsx");
const legacyPostViewRoute = read("app/admin/(protected)/posts/[id]/view/page.tsx");
const postActions = read("app/admin/post-actions.ts");
const pages = read("app/admin/(protected)/pages/PagesManager.module.css");
const homeManager = read("app/admin/components/HomeManagerView.tsx");
const mediaManager = read("app/admin/(protected)/media/MediaLibrary.tsx");
const headerManager = read("app/admin/(protected)/header/HeaderManagerView.tsx");
const mediaKit = read("app/admin/(protected)/media-kit/page.tsx");

test("protected admin has one final shared visual authority", () => {
  const dashboardImport = entry.indexOf('@import "../../styles/admin/dashboard.css"');
  const featureImport = entry.indexOf('@import "../../styles/admin/dashboard-feature-overrides.css"');
  const runtimeImport = entry.indexOf('@import "../../styles/admin/dashboard-runtime-contract.css"');
  assert.notEqual(dashboardImport, -1);
  assert.notEqual(featureImport, -1);
  assert.notEqual(runtimeImport, -1);
  assert.ok(featureImport > dashboardImport);
  assert.ok(runtimeImport > featureImport, "shared runtime contract must be the final protected-admin visual authority");
  assert.doesNotMatch(entry, /dashboard-module-contract\.css/);
  assert.equal(fs.existsSync(new URL("../../styles/admin/dashboard-module-contract.css", import.meta.url)), false);
  assert.match(entry, /single final visual authority/);
});

test("canonical admin density, palette and typography resolve from Dashboard", () => {
  assert.match(dashboard, /\.adminDashboard\s*\{[^}]*gap:\s*14px/);
  assert.match(dashboard, /\.adminDashboardHeading h1\s*\{[^}]*font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\)/);
  assert.match(dashboard, /border:\s*1px solid #e1e6eb/);
  assert.match(dashboard, /border-radius:\s*10px/);
  assert.match(runtimeContract, /--dashboard-bg:#f5f5f4/);
  assert.match(runtimeContract, /--dashboard-border:#e1e6eb/);
  assert.match(runtimeContract, /--dashboard-red:#e30613/);
  assert.match(runtimeContract, /font-family:Montserrat,Arial,sans-serif/);
  assert.match(runtimeContract, /height:34px!important/);
});

test("canonical contract targets semantic module classes without bundler hash assumptions", () => {
  for (const selector of ["toolbar", "tableSurface", "catalogFrame", "selectionCard", "structureCard", "statusBadge"]) {
    assert.match(runtimeContract, new RegExp(`\\[class\\*="${selector}" i\\]`));
  }
  assert.doesNotMatch(runtimeContract, /_toolbar__/);
  assert.doesNotMatch(runtimeContract, /_card__/);
  assert.match(runtimeContract, /table:not\(\.tableview-freeform\) th/);
  assert.match(runtimeContract, /table:not\(\.tableview-freeform\) td/);
});

test("feature overrides are limited to domain geometry while preserving shared colors and density", () => {
  assert.match(featureOverrides, /\[data-testid="artist-manager"\]/);
  assert.match(featureOverrides, /\.homeSectionCard/);
  assert.match(featureOverrides, /\[data-testid="header-manager"\]/);
  assert.match(featureOverrides, /\[data-testid="page-section-workbench"\]/);
  assert.match(featureOverrides, /border:\s*1px solid #e1e6eb !important/);
  assert.match(featureOverrides, /border-radius:\s*10px !important/);
});

test("Artists keeps the table-first manager and one shared page heading", () => {
  assert.match(artistManager, /data-testid="artist-manager"/);
  assert.doesNotMatch(artistManager, /adminDashboardHeading/);
  assert.match(artistManager, /className="srOnly">Status<\/span>/);
  assert.match(artistManager, /className="srOnly">Gênero<\/span>/);
  assert.match(artistManager, /className="srOnly">Ordenar por<\/span>/);
  assert.match(artistManager, /styles\.tableSurface/);
  assert.match(artists, /\.artistTable th\{height:38px/);
  assert.match(adminShell, /title: "Artistas"/);
  assert.match(adminShell, /action: \{ label: "Novo artista"/);
});

test("Contents uses category as its sole active taxonomy and no redundant publications tab", () => {
  assert.match(postManager, /data-testid="posts-manager"/);
  assert.doesNotMatch(postManager, /aria-label="Seção de conteúdos"/);
  assert.doesNotMatch(postManager, /tags: string\[\]|tagIds: string\[\]|tags\?: Option\[\]|tags=\{/);
  assert.doesNotMatch(postsPage, /postTags|\btags\b|filters\.tag|tagOptionRows|tagRows/);
  assert.doesNotMatch(postActions, /postTags|uuidList|tagIds/);
  assert.match(postManager, /<span>Categoria<\/span>/);
  assert.match(postManager, /<ViewInfo label="Categoria">/);
  assert.match(postActions, /Categoria é obrigatória/);
});

test("Content create, edit, view and row actions share accessible interaction contracts", () => {
  assert.match(adminShell, /action: \{ label: "Novo conteúdo", event: "admin:new-content", icon: "plus", requiresEdit: true \}/);
  assert.match(adminShell, /const headerAction = contextualHeader\?\.action && \(!contextualHeader\.action\.requiresEdit \|\| canEdit\)/);
  assert.match(postManager, /type ModalMode = "create" \| "edit" \| "view"/);
  assert.match(postManager, /window\.addEventListener\("admin:new-content", openModal\)/);
  assert.match(postManager, /aria-haspopup="menu"/);
  assert.match(postManager, /document\.addEventListener\("pointerdown", pointerDown\)/);
  assert.match(postManager, /positionFloatingMenu\(trigger\.getBoundingClientRect\(\), menu\.getBoundingClientRect\(\)\)/);
  assert.match(postManager, /function useDialogLifecycle/);
  assert.match(postManager, /aria-modal="true"/);
  assert.match(postManager, /<ReactMarkdown remarkPlugins=\{\[remarkGfm\]\}>/);
  assert.match(postManager, /trustedExternalUrl\(url\)/);
  assert.match(posts, /\.viewDialog\{[\s\S]*grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(postsPage, /filters\.create === "1" \? "create" : filters\.edit \? "edit" : filters\.view \? "view"/);
  assert.match(legacyPostRoute, /if \(id === "new"\) redirect\("\/admin\/posts\?create=1"\)/);
  assert.match(legacyPostViewRoute, /redirect\(`\/admin\/posts\?view=\$\{encodeURIComponent\(id\)\}`\)/);
  assert.match(postActions, /redirect\(`\/admin\/posts\?edit=\$\{encodeURIComponent\(postId\)\}&saved=1`\)/);
});

test("canonical URL and external content links are validated on the server", () => {
  assert.match(postActions, /normalizeCanonicalOverride/);
  assert.match(postActions, /canonicalUrl = normalizeCanonicalOverride\(text\(formData, "canonicalUrl"\)\)/);
  assert.match(postActions, /normalizePlatformUrl\(item\.platform, item\.url\)/);
  assert.match(postActions, /requirePersistentAdmin\("editor"\)/);
  assert.match(postActions, /publicationLink: `\/noticias\/\$\{slug\}`/);
});

test("Home, Media, Header and Media Kit rely on the shared contextual heading", () => {
  assert.doesNotMatch(homeManager, /adminDashboardHeading/);
  assert.doesNotMatch(mediaManager, /adminDashboardHeading/);
  assert.doesNotMatch(mediaKit, /adminDashboardHeading/);
  assert.doesNotMatch(headerManager, /<h1>Cabeçalho<\/h1>/);
  assert.match(adminShell, /title: "Home"/);
  assert.match(adminShell, /title: "Mídias"/);
  assert.match(adminShell, /title: "Cabeçalho"/);
  assert.match(adminShell, /title: "Mídia Kit"/);
  assert.match(adminShell, /event: "admin:add-media"/);
  assert.match(mediaManager, /window\.addEventListener\("admin:add-media",open\)/);
});

test("Admin contextual copy names Lander Records instead of borrowing Portal Lander product language", () => {
  assert.doesNotMatch(adminShell, /Portal Lander|desempenho do portal|controles de acesso do Portal/);
  assert.match(adminShell, /site da Lander Records/);
  assert.match(adminShell, /workbench visual canônico da Lander Records/);
});

test("Pages keep canonical structure protection and shared table geometry", () => {
  assert.match(pages, /\.selectionCard,\.structureCard\{[\s\S]*border-radius:10px/);
  assert.match(pages, /\.sectionsRow\{min-height:50px/);
  assert.match(pages, /\.statusBadge\{[\s\S]*border-radius:5px/);
});
