import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/pages/PageManager.tsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page-contract.ts", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");
const editor = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/page.tsx", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/view/page.tsx", import.meta.url), "utf8");

test("Pages list uses only real enabled and SEO states", () => {
  assert.match(page, /seoIncomplete:[\s\S]*seoTitle[\s\S]*seoDescription/);
  assert.match(page, /enabled:[\s\S]*pages\.enabled/);
  assert.doesNotMatch(manager, /Publicad[ao]s?|Rascunhos?|Arquivad[ao]s?/);
  assert.match(manager, /Conteúdo habilitado/);
  assert.match(manager, /SEO editorial incompleto/);
});

test("Pages filters are server-side and preserve global metrics", () => {
  assert.match(page, /searchParams: Promise<PageFilters>/);
  assert.match(page, /ilike\(pages\.title, pattern\)/);
  assert.match(page, /where\(conditions\.length \? and\(\.\.\.conditions\)/);
  assert.match(manager, /if \(!preview\) return pages/);
  assert.match(manager, /Mostrando \{filtered\.length\} de \{counts\.total\} páginas/);
});

test("Public links come from a deterministic route registry", () => {
  for (const mapping of ["home: { route: \"/\"", "about: { route: \"/sobre-nos\"", "artists: { route: \"/artistas\"", "news: { route: \"/noticias\"", "contact: { route: \"/contato\""]) assert.match(contract, new RegExp(mapping.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(contract, /route: null/);
  assert.doesNotMatch(manager, /href=\{page\.configuredRoute\}/);
  assert.match(manager, /page\.publicRoute && !preview/);
  assert.match(editor, /pageContract\(page\.key\)\.route/);
  assert.match(view, /pageContract\(page\.key\)\.route/);
  assert.doesNotMatch(page, /page\.enabled \? contract\.route/);
  assert.match(manager, /Registro atualizado/);
  assert.match(view, /Não definido \(fallback global\)/);
  assert.doesNotMatch(view, /sectionKey:|sectionId:|definition:|definitionId \|\|/);
});

test("Pages preview is isolated and creation is not promoted", () => {
  assert.match(preview, /previewPages/);
  assert.match(preview, /<PageManager pages=\{previewPages\} preview/);
  assert.doesNotMatch(preview, /page-actions|createPageAction|attachSectionAction/);
  assert.doesNotMatch(manager, /Nova página|Mais filtros|Tipos de página|Revisão de conteúdo/);
  assert.match(manager, /Novos registros não recebem automaticamente uma rota ou template/);
});

test("Page editor exposes only contextual fields and scopes item reads", () => {
  assert.doesNotMatch(editor, /adminCode/);
  assert.match(editor, /const sectionFields:/);
  assert.match(editor, /const itemFields:/);
  assert.match(editor, /where\(inArray\(pageSectionItems\.sectionId/);
  assert.doesNotMatch(editor, /Mídia<select|settings JSON|metadata JSON/);
});
