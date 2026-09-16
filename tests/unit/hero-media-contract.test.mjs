import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const contract = read("app/admin/(protected)/pages/site-page-contract.ts");
const workbench = read("app/admin/(protected)/pages/[id]/PageContentWorkbench.tsx");
const actions = read("app/admin/(protected)/pages/[id]/hero-media-actions.ts");
const editorPage = read("app/admin/(protected)/pages/[id]/page.tsx");
const repository = read("modules/pages/repository.ts");
const home = read("app/(public)/page.tsx");
const homeStyles = read("app/home-extra.css");
const nextConfig = read("next.config.mjs");

test("Home Hero contract supports a direct image or video asset", () => {
  assert.match(contract, /media\?: "item-image" \| "section-image-video"/);
  assert.match(contract, /media: "section-image-video"/);
  assert.match(contract, /mediaLabel: "Imagem ou vídeo do Hero"/);
  assert.match(contract, /maxItems: 2/);
});

test("Hero editor exposes upload, library reuse and removal controls", () => {
  assert.match(workbench, /uploadPageSectionMedia/);
  assert.match(workbench, /setPageSectionMedia/);
  assert.match(workbench, /removePageSectionMedia/);
  assert.match(workbench, /accept="image\/\*,video\/\*"/);
  assert.match(workbench, /Enviar nova imagem ou vídeo/);
  assert.match(workbench, /máximo de 50 MB/);
  assert.match(workbench, /Aplicar mídia existente/);
  assert.match(workbench, /Remover do Hero/);
  assert.match(editorPage, /mediaId: sectionMediaId\(section\.settings\)/);
});

test("Hero media write path validates file type, size and the canonical section media contract", () => {
  assert.match(actions, /requirePersistentAdmin\("editor"\)/);
  assert.match(actions, /MAX_HERO_MEDIA_BYTES = 50 \* 1024 \* 1024/);
  assert.match(actions, /mimeType\.startsWith\("image\/"\) \|\| mimeType\.startsWith\("video\/"\)/);
  assert.match(actions, /sitePageContract\(page\.key\)/);
  assert.match(actions, /siteSectionContract\(page\.key, section\.sectionKey\)/);
  assert.match(actions, /sectionContract\.media !== "section-image-video"/);
  assert.match(actions, /Esta seção não possui contrato público para mídia de fundo/);
  assert.match(actions, /eq\(pageSections\.pageId, pageId\)/);
  assert.match(actions, /eq\(mediaAssets\.status, "active"\)/);
  assert.match(actions, /deleteStoredMedia\(stored\.key\)/);
  assert.match(actions, /uploadStoredMedia/);
  assert.match(actions, /settings: \{ \.\.\.\(context\.section\.settings \|\| \{\}\), mediaId \}/);
  assert.match(nextConfig, /bodySizeLimit: "64mb"/);
});

test("Hero media revalidates the public route owned by the page contract", () => {
  assert.match(actions, /revalidatePath\(publicRoute\)/);
  assert.match(actions, /refreshSection\(context\.page\.id, context\.pageContract\.route\)/);
  assert.doesNotMatch(actions, /function refreshHero[\s\S]*revalidatePath\("\/"\)/);
  assert.match(actions, /redirect\(`\/admin\/pages\/\$\{pageId\}\?section=/);
});

test("Public Home resolves and renders the configured hero image or video", () => {
  assert.match(repository, /sectionMediaId\(section\.settings\)/);
  assert.match(repository, /mediaUrl: directMedia\?\.url/);
  assert.match(repository, /mediaMimeType: directMedia\?\.mimeType/);
  assert.match(home, /hero\.mediaMimeType\.startsWith\("video\/"\)/);
  assert.match(home, /className="homeHeroMedia"/);
  assert.match(home, /autoPlay loop muted playsInline/);
  assert.match(homeStyles, /\.homeHeroMedia\{[^}]*object-fit:cover/);
  assert.match(homeStyles, /\.homeHeroHasMedia \.homeHeroBackdrop/);
});
