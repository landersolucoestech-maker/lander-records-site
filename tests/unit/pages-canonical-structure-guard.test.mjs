import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const manager = read("app/admin/(protected)/pages/PageManager.tsx");
const actions = read("app/admin/page-actions.ts");

test("canonical pages do not offer arbitrary section creation in the overview", () => {
  assert.match(manager, /const allowStructureMutation = allowCreate && !canonicalPage/);
  assert.match(manager, /allowStructureMutation \? <button[\s\S]*Criar seção[\s\S]*Estrutura canônica/);
  assert.match(manager, /createSectionOpen && allowStructureMutation/);
  assert.match(manager, /disabled=\{!allowStructureMutation \|\| !sectionName\.trim\(\) \|\| !sectionIdentifier\.trim\(\)\}/);
});

test("canonical page structure is protected again at the server-action boundary", () => {
  assert.match(actions, /import \{ sitePageContract \} from "\.\/\(protected\)\/pages\/site-page-contract"/);
  assert.match(actions, /function assertMutablePageStructure/);
  assert.match(actions, /sitePageContract\(page\.key\)/);
  assert.match(actions, /estrutura desta página é canônica/i);

  const guardCalls = actions.match(/assertMutablePageStructure\(/g) || [];
  assert.equal(guardCalls.length, 5, "helper definition plus delete/create/attach/detach guards must remain present");

  for (const actionName of ["deletePageAction", "createPageSectionAction", "attachSectionAction", "detachSectionAction"]) {
    const start = actions.indexOf(`export async function ${actionName}`);
    assert.notEqual(start, -1, `${actionName} must exist`);
    const nextExport = actions.indexOf("export async function ", start + 1);
    const body = actions.slice(start, nextExport === -1 ? actions.length : nextExport);
    assert.match(body, /assertMutablePageStructure\(/, `${actionName} must enforce the canonical structure guard`);
  }
});
