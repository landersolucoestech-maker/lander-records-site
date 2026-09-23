import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const preview = read("app/admin/(protected)/media-kit/components/MediaKitPreviewDeck.tsx");
const builder = read("app/admin/(protected)/media-kit/components/MediaKitBuilder.tsx");
const actions = read("app/admin/(protected)/media-kit/actions.ts");
const css = read("app/admin/(protected)/media-kit/MediaKitPreview.module.css");
const editorCss = read("app/admin/(protected)/media-kit/MediaKit.module.css");
const contract = read("app/admin/(protected)/media-kit/media-kit-contract.ts");

test("media kit has one explicit visual contract for image placement", () => {
  assert.match(contract, /MEDIA_FIT_VALUES/);
  assert.match(contract, /MEDIA_POSITION_VALUES/);
  assert.match(builder, /Tratamento da imagem/);
  assert.match(builder, /Só a capa permite fotografia como fundo integral/);
  assert.match(actions, /Enquadramento de imagem inválido/);
  assert.match(actions, /Foco de imagem inválido/);
});

test("media kit preview never injects promotional photos as implicit backgrounds", () => {
  assert.doesNotMatch(css, /dj-stay-wide\.webp|dj-stay-home-card\.webp|lander-records-anuncie-banner\.webp/);
  assert.doesNotMatch(preview, /dj-stay-wide\.webp|dj-stay-home-card\.webp|lander-records-anuncie-banner\.webp/);
  assert.match(preview, /backgroundStyle\(section/);
  assert.match(css, /authoritative, isolated, overflow-safe/);
});

test("editorial pages do not reuse one section image across multiple backgrounds", () => {
  assert.match(preview, /refEditorialImage/);
  assert.match(preview, /refAboutBanner/);
  assert.doesNotMatch(preview, /refAboutBanner[^\n]*style=/);
  assert.match(preview, /refNextStepsMedia/);
  assert.match(preview, /refFeaturedArtistImage/);
});

test("preview filters operational placeholders and respects explicit section position", () => {
  assert.match(contract, /a integrar/);
  assert.match(contract, /não configurado/);
  assert.match(preview, /publishableValue/);
  assert.match(preview, /visibleByPosition\(sections\)/);
  assert.doesNotMatch(preview, /sectionPriority/);
});

test("audience preview publishes only verified quantitative metrics", () => {
  assert.match(preview, /Métricas quantitativas só entram quando estiverem verificadas/);
  assert.match(preview, /numberValue\(item\.metadata, "percentage"\) > 0/);
  assert.doesNotMatch(preview, />A INTEGRAR</);
});


test("section management is free-form and uses the editor permission consistently", () => {
  assert.doesNotMatch(builder, /quickSectionTemplates/);
  assert.match(builder, /Crie uma seção livremente/);
  assert.match(builder, /Remover seção/);
  assert.match(actions, /export async function deleteMediaKitSection[\s\S]*?requireMediaKitMutationAdmin\("editor"\)/);
  assert.match(editorCss, /\.createSectionPanel\{/);
  assert.match(editorCss, /\.builderSection>summary\{/);
});

test("media kit typography avoids the previous extra-bold display treatment", () => {
  assert.doesNotMatch(css, /font-family:Impact,Haettenschweiler/);
  assert.doesNotMatch(css, /font-weight:950|font-weight:900|font-weight:850/);
  assert.match(css, /font-family:Montserrat,Arial,sans-serif/);
});


test("live preview is isolated from editor CSS and uses one stable landscape grid", () => {
  assert.match(preview, /MediaKitPreview\.module\.css/);
  assert.match(preview, /data-preview-version="clean-grid-v1"/);
  assert.match(css, /aspect-ratio:16\/9!important/);
  assert.match(css, /grid-template-rows:2\.4cqw minmax\(0,1fr\) 1\.45cqw/);
  assert.match(css, /overflow:hidden/);
  assert.doesNotMatch(css, /Media Kit v3|Media Kit v4|Strict reference structure fixes/);
});

test("dense dynamic content is capped before it can overflow the live preview", () => {
  assert.match(preview, /measurable\(group\("age"\)\)\.slice\(0, 5\)/);
  assert.match(preview, /group\("interest"\)[\s\S]*?\.slice\(0, 5\)/);
  assert.match(preview, /measurable\(group\("city"\)\)\.slice\(0, 4\)/);
  assert.match(preview, /filter\(\(\{ value \}\) => value !== ""\)[\s\S]*?\.slice\(0, 5\)/);
});


test("cover composition uses a bounded visual panel instead of the fragile laptop mockup", () => {
  assert.match(preview, /media-kit-cover-visual/);
  assert.match(preview, /CoverVisual/);
  assert.doesNotMatch(preview, /LaptopMockup|media-kit-cover-laptop/);
  assert.match(css, /\.refCoverMedia\{/);
  assert.match(css, /\.refCoverCopy h3\{[^}]*font-size:4\.45cqw/);
});

test("specialized pages always have an editorial heading fallback", () => {
  for (const label of [
    "INDICADORES DA LANDER RECORDS",
    "SOBRE A LANDER RECORDS",
    "NOSSA AUDIÊNCIA",
    "PARCERIAS E OPORTUNIDADES",
    "ARTISTAS E DESTAQUES",
    "VAMOS CONVERSAR",
  ]) assert.match(preview, new RegExp(label));
});


test("live preview padding stays compact so page content uses the available frame", () => {
  assert.match(css, /padding-inline:\.28cqw/);
  assert.match(css, /\.refCover\{[^}]*padding:\.28cqw \.65cqw \.2cqw/);
  assert.match(css, /\.refAboutBody\{[^}]*padding:\.28cqw \.65cqw \.2cqw/);
  assert.match(css, /\.refAudienceBody\{[^}]*padding:\.25cqw \.65cqw \.16cqw/);
  assert.match(editorCss, /\.previewViewport\{[^}]*padding:0/);
});


test("cover background stays neutral without decorative red glow", () => {
  assert.match(css, /\.refCover\{[^}]*background:#0a0c0f/);
  assert.doesNotMatch(css, /radial-gradient\([^)]*237,28,36/);
  assert.doesNotMatch(css, /refPartnerVisualPlain:after\{[^}]*237,28,36/);
});


test("all live preview cards and panels use compact internal spacing", () => {
  assert.match(css, /\.refAudiencePanel\{[^}]*padding:\.2cqw \.28cqw/);
  assert.match(css, /\.refAboutBanner\{[^}]*padding:\.3cqw \.45cqw/);
  assert.match(css, /\.refFeaturedArtist\{[^}]*padding:\.3cqw/);
  assert.match(css, /\.refNextSteps\{[^}]*padding:\.38cqw/);
  assert.match(css, /\.refGenericGrid article\{[^}]*padding:\.18cqw/);
});


test("every media kit section uses edge-tight page padding", () => {
  const expected = [
    [/\.refCover\{[^}]*padding:\.28cqw \.65cqw \.2cqw/, "cover"],
    [/\.refAboutBody\{[^}]*padding:\.28cqw \.65cqw \.2cqw/, "about"],
    [/\.refAudienceBody\{[^}]*padding:\.25cqw \.65cqw \.16cqw/, "audience"],
    [/\.refPartnershipBody\{[^}]*padding:\.25cqw \.65cqw \.16cqw/, "partnership"],
    [/\.refArtistsBody\{[^}]*padding:\.25cqw \.65cqw \.16cqw/, "artists"],
    [/\.refContactBody\{[^}]*padding:\.28cqw \.65cqw \.2cqw/, "contact"],
    [/\.refGenericBody\{[^}]*padding:\.25cqw \.65cqw \.16cqw/, "generic"],
  ];
  for (const [pattern, name] of expected) assert.match(css, pattern, name);
});
