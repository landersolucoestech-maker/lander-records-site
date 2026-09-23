import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path)=>fs.readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const preview=read("app/admin/(protected)/media-kit/components/MediaKitPreviewDeck.tsx");
const builder=read("app/admin/(protected)/media-kit/components/MediaKitBuilder.tsx");
const actions=read("app/admin/(protected)/media-kit/actions.ts");
const css=read("app/admin/(protected)/media-kit/MediaKitPreview.module.css");
const editorCss=read("app/admin/(protected)/media-kit/MediaKit.module.css");
const mocks=read("lib/mocks/media-kit.ts");

test("media kit reference deck is portrait and isolated from editor styles",()=>{
  assert.match(preview,/MediaKitPreview\.module\.css/);
  assert.match(preview,/data-preview-version="reference-portrait-v1"/);
  assert.match(css,/aspect-ratio:4\/5!important/);
  assert.match(css,/container-type:inline-size/);
  assert.match(css,/grid-template-rows:7cqw minmax\(0,1fr\) 4\.2cqw/);
  assert.doesNotMatch(css,/aspect-ratio:16\/9/);
  assert.match(editorCss,/\.previewViewport\{[^}]*overflow-y:auto/);
});

test("the six-page reference sequence is implemented as dedicated templates",()=>{
  for(const token of ["CoverPage","AboutPage","AudiencePage","AdvertisingPage","ApplicationPage","ContactPage"]) assert.match(preview,new RegExp(token));
  assert.match(preview,/section\.type==="application"/);
  assert.match(builder,/05 · Exemplo de aplicação/);
  assert.match(actions,/application/);
  assert.match(mocks,/type:"application"/);
});

test("reference page four is advertising and page five is a placement example",()=>{
  assert.match(preview,/FORMATOS DE PUBLICIDADE/);
  assert.match(preview,/data-reference-slot="advertising-grid"/);
  assert.match(preview,/EXEMPLO DE APLICAÇÃO/);
  assert.match(preview,/data-reference-slot="application-example"/);
  for(const label of ["Banner topo","Publicidade lateral","Anuncie aqui","Página de conteúdo","Newsletter","Redes sociais"]) assert.match(mocks,new RegExp(label,"i"));
});

test("reference audience page contains the four expected information blocks",()=>{
  for(const label of ["PERFIL DO PÚBLICO","FAIXA ETÁRIA","PRINCIPAIS INTERESSES","PRINCIPAIS CIDADES"]) assert.match(preview,new RegExp(label));
  assert.match(preview,/slice\(0, 5\)/);
  assert.match(preview,/slice\(0, 6\)/);
});

test("cover and about pages retain strong editorial hierarchy",()=>{
  assert.match(preview,/coverHeadline/);
  assert.match(css,/\.coverCopy h2\{[^}]*font-size:4\.15cqw/);
  assert.match(css,/\.aboutMetrics\{[^}]*grid-template-columns:repeat\(5,1fr\)/);
  assert.match(css,/\.aboutBanner\{/);
  assert.match(preview,/data-reference-slot="about-kpis"/);
});

test("contact page follows the two-column reference ending",()=>{
  assert.match(preview,/VAMOS CONSTRUIR ALGO GRANDE JUNTOS/);
  assert.match(preview,/PRÓXIMOS PASSOS/);
  assert.match(css,/\.contact\{[^}]*grid-template-columns:\.9fr 1\.1fr/);
  assert.match(preview,/data-reference-slot="contact-grid"/);
});

test("builder keeps free section management and supports the reference application type",()=>{
  assert.match(builder,/Crie uma seção livremente/);
  assert.match(builder,/Remover seção/);
  assert.match(builder,/04 · Formatos de publicidade/);
  assert.match(builder,/05 · Exemplo de aplicação/);
  assert.match(builder,/Exemplo de aplicação/);
  assert.match(actions,/deleteMediaKitSection[\s\S]*?requireMediaKitMutationAdmin\("editor"\)/);
});


test("persisted canonical deck is migrated to the same six-page reference sequence", () => {
  const migration = read("migrations/0017_media_kit_reference_sequence.sql");
  assert.match(migration, /FORMATOS DE PUBLICIDADE/);
  assert.match(migration, /type = 'application'/);
  assert.match(migration, /EXEMPLO DE APLICAÇÃO/);
  for (const label of ["Banner Topo","Publicidade Lateral","Anuncie Aqui","Conteúdo Editorial"]) {
    assert.match(migration, new RegExp(label));
  }
  assert.match(migration, /VAMOS CONSTRUIR ALGO GRANDE JUNTOS/);
});


test("reference deck typography stays proportionate inside the portrait preview",()=> {
  assert.match(css,/\.heading h3,[^}]*font-size:3\.35cqw/);
  assert.match(css,/\.headingCompact h3\{font-size:2\.7cqw/);
  assert.match(css,/\.aboutMetrics b\{font-size:1\.25cqw/);
  assert.match(css,/\.aboutMetrics strong\{[^}]*font-size:\.5cqw/);
  assert.match(css,/\.aboutMetrics strong\{[^}]*overflow-wrap:anywhere/);
  assert.match(css,/\.aboutBanner strong\{[^}]*font-size:1\.55cqw/);
  assert.match(css,/\.contactMain \.heading h3\{font-size:3\.15cqw/);
  assert.match(css,/\.coverCopy h2\{[^}]*font-size:4\.15cqw/);
  assert.doesNotMatch(css,/font-size:6\.6cqw|font-size:5\.5cqw|font-size:5\.2cqw|font-size:5\.15cqw|font-size:4\.25cqw/);
});
