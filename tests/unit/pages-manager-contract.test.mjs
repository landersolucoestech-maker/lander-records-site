import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/pages/PageManager.tsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../../app/admin/(protected)/pages/PagesManager.module.css", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../../app/admin/components/AdminShell.tsx", import.meta.url), "utf8");
const shellStyles = fs.readFileSync(new URL("../../styles/admin/shell.css", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../../app/admin/(protected)/pages/page-contract.ts", import.meta.url), "utf8");
const editor = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/page.tsx", import.meta.url), "utf8");
const workbench = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/PageContentWorkbench.tsx", import.meta.url), "utf8");
const workbenchStyles = fs.readFileSync(new URL("../../app/admin/(protected)/pages/[id]/PageContentWorkbench.module.css", import.meta.url), "utf8");
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

test("Admin chrome follows the Portal Lander black-header and grouped-navigation pattern", () => {
  assert.match(shell, /adminAdministrationLabel/);
  assert.match(shell, />ADMINISTRAÇÃO</);
  assert.match(shell, />NAVEGAÇÃO</);
  assert.match(shell, /adminHeaderBack/);
  assert.match(shell, /adminAccountPopover/);
  assert.match(shell, /name="bell"/);
  assert.match(shellStyles, /--admin-sidebar-width: 238px/);
  assert.match(shellStyles, /--admin-header-height: 68px/);
  assert.match(shellStyles, /background: #050505/);
  assert.match(shellStyles, /background: #211113/);
  assert.match(shellStyles, /background: var\(--admin-accent\)/);
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

test("Page editor clones the Portal Lander section workbench while preserving current persistence actions", () => {
  assert.match(editor, /AdminContextHeaderSync/);
  assert.match(editor, /PageContentWorkbench/);
  assert.match(editor, /where\(inArray\(pageSectionItems\.sectionId/);
  assert.match(workbench, /Configurar seção:/);
  assert.match(workbench, /Imagem de Fundo/);
  assert.match(workbench, /Destaques do Hero/);
  assert.match(workbench, /Preview da página inteira/);
  assert.match(workbench, /Conteúdo/);
  assert.match(workbench, /Aparência/);
  assert.match(workbench, /Comportamento/);
  assert.match(workbench, /updatePageSection/);
  assert.match(workbench, /updatePageSectionItem/);
  assert.match(workbench, /<iframe/);
  assert.match(workbench, /src=\{publicRoute\}/);
  assert.match(workbench, /name="monitor"/);
  assert.match(workbench, /name="tablet"/);
  assert.match(workbench, /name="smartphone"/);
  assert.match(workbenchStyles, /grid-template-columns:minmax\(350px,390px\) minmax\(0,1fr\)/);
  assert.match(workbenchStyles, /height:calc\(100dvh - 132px\)/);
  assert.match(workbenchStyles, /overflow-y:scroll/);
  assert.match(workbenchStyles, /min-height:52px/);
  assert.match(workbenchStyles, /border-color:#e50914/);
  assert.doesNotMatch(editor, /adminPanel adminStack/);
});
