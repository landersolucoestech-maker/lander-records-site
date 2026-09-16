import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/pages/PageManager.tsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../../app/admin/(protected)/pages/PagesManager.module.css", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../../app/admin/components/AdminShell.tsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page-contract.ts", import.meta.url), "utf8");
const editor = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/page.tsx", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/view/page.tsx", import.meta.url), "utf8");

test("Pages overview follows the approved selected-page and section-structure composition", () => {
  for (const copy of [
    "Página selecionada",
    "Estrutura da página",
    "Página inicial",
    "Ver página pública",
    "Editar",
    "Excluir",
    "Criar seção",
    "Seção",
    "Status",
    "Ações",
    "Configurar",
  ]) assert.match(manager, new RegExp(copy, "i"));

  assert.doesNotMatch(manager, /Total de páginas|SEO editorial incompleto|Buscar por título|Limpar filtros|Navegação é gerenciada separadamente/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\) 180px 220px/);
  assert.match(styles, /background:#080b0e/);
});

test("Disposable development preview reproduces the ten-section approved reference without changing production data", () => {
  const titles = ["Hero Section", "Em Destaque", "Mais Lidas", "Últimas Notícias", "Publicidade Lateral", "Em Alta", "Anuncie Aqui", "Lançamentos", "Agenda", "Newsletter"];
  for (const title of titles) assert.match(manager, new RegExp(title));
  assert.match(manager, /sectionCount: 10/);
  assert.match(manager, /demoMode \|\| preview \? referencePages : pages/);
  assert.match(page, /demoMode=\{session\.source === "development-auth-bypass"\}/);
  assert.match(page, /sections: pageStructure/);
  assert.match(page, /pageSections\.subtitle/);
});

test("Pages shell uses the approved contextual header", () => {
  assert.match(shell, /pagesIndex/);
  assert.match(shell, /Gerencie páginas e configure cada seção com edição e preview em tempo real\./);
  assert.match(shell, />Criar página</);
  assert.match(shell, /name="bell"/);
  assert.match(shell, /developmentPreview \? "DE"/);
  assert.match(styles, /adminTopbarPages/);
  assert.match(styles, /adminNotificationButton/);
});

test("Public page destinations remain deterministic and real routes are used", () => {
  for (const mapping of ["home: { route: \"/\"", "about: { route: \"/sobre-nos\"", "artists: { route: \"/artistas\"", "news: { route: \"/noticias\"", "contact: { route: \"/contato\""]) {
    assert.match(contract, new RegExp(mapping.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(contract, /route: null/);
  assert.match(manager, /selected\.publicRoute/);
  assert.match(editor, /pageContract\(page\.key\)\.route/);
  assert.match(view, /pageContract\(page\.key\)\.route/);
});

test("Page editor still exposes contextual fields and scopes item reads", () => {
  assert.doesNotMatch(editor, /adminCode/);
  assert.match(editor, /const sectionFields:/);
  assert.match(editor, /const itemFields:/);
  assert.match(editor, /where\(inArray\(pageSectionItems\.sectionId/);
  assert.doesNotMatch(editor, /Mídia<select|settings JSON|metadata JSON/);
});
