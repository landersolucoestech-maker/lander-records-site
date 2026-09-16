import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contractModule = await import(new URL("../../app/admin/page-content-contract.ts", import.meta.url));
const guardedActions = fs.readFileSync(new URL("../../app/admin/page-content-actions.ts", import.meta.url), "utf8");
const legacyActions = fs.readFileSync(new URL("../../app/admin/actions.ts", import.meta.url), "utf8");

const editableContract = {
  label: "Hero",
  description: "",
  fields: ["title", "subtitle"],
  itemFields: ["label", "url"],
  allowAddItems: true,
  maxItems: 2,
  source: "public",
};

const fixedMediaContract = {
  label: "Banner",
  description: "",
  fields: [],
  itemFields: [],
  maxItems: 1,
  media: "item-image",
  source: "public",
};

test("canonical field allowlists follow the Lander Records section contract", () => {
  assert.deepEqual(contractModule.allowedSectionFields(editableContract, true), ["title", "subtitle"]);
  assert.deepEqual(contractModule.allowedItemFields(editableContract, true), ["label", "url"]);
  assert.deepEqual(contractModule.allowedSectionFields(null, false), ["eyebrow", "title", "subtitle", "body"]);
  assert.deepEqual(contractModule.allowedItemFields(null, false), ["title", "subtitle", "body", "label", "url"]);
  assert.equal(contractModule.canEditItem(fixedMediaContract, true), true);
  assert.equal(contractModule.canCreateOrDeleteItems(fixedMediaContract, true), false);
});

test("canonical maxItems is enforced independently of the client", () => {
  assert.doesNotThrow(() => contractModule.assertItemCapacity(editableContract, true, 1));
  assert.throws(() => contractModule.assertItemCapacity(editableContract, true, 2), /no máximo 2/);
  assert.doesNotThrow(() => contractModule.assertItemCapacity(editableContract, false, 200));
  assert.throws(() => contractModule.assertItemCapacity(fixedMediaContract, true, 0), /não permite criação/);
});

test("CMS destinations reject executable or ambiguous URLs", () => {
  for (const value of ["/contato", "/artistas?x=1#topo", "https://example.com/path", "mailto:contato@example.com", "tel:+5533999999999"]) {
    assert.ok(contractModule.normalizeCmsDestination(value));
  }
  for (const value of ["javascript:alert(1)", "//evil.example", "http://example.com", "https://user:pass@example.com", "/artistas\\evil", "https://example.com/evil\u0007"]) {
    assert.throws(() => contractModule.normalizeCmsDestination(value), /Destino inválido/);
  }
});

test("page content mutations resolve page, section and public contract on the server", () => {
  assert.match(guardedActions, /resolveSectionContext/);
  assert.match(guardedActions, /section\.pageId !== page\.id/);
  assert.match(guardedActions, /sitePageContract\(page\.key\)/);
  assert.match(guardedActions, /siteSectionContract\(page\.key, section\.sectionKey\)/);
  assert.match(guardedActions, /A seção não pertence ao contrato público desta página/);
  assert.match(guardedActions, /allowedSectionFields/);
  assert.match(guardedActions, /allowedItemFields/);
});

test("item creation is race-safe and server-owned", () => {
  assert.match(guardedActions, /pg_advisory_xact_lock/);
  assert.match(guardedActions, /assertItemCapacity/);
  assert.match(guardedActions, /itemKey: `item-\$\{crypto\.randomUUID\(\)\}`/);
  assert.doesNotMatch(guardedActions, /itemKey: text\(formData, "itemKey"\)/);
  assert.match(guardedActions, /Math\.max\(\.\.\.currentItems\.map/);
});

test("media selection is validated against active assets and canonical image requirements", () => {
  assert.match(guardedActions, /eq\(mediaAssets\.status, "active"\)/);
  assert.match(guardedActions, /!media\.mimeType\.startsWith\("image\/"\)/);
  assert.match(guardedActions, /context\.sectionContract\?\.media === "item-image"/);
});

test("legacy action entrypoint delegates all page content writes to guarded actions", () => {
  for (const name of ["guardedUpdatePageSection", "guardedAddPageSectionItem", "guardedUpdatePageSectionItem", "guardedDeletePageSectionItem"]) {
    assert.match(legacyActions, new RegExp(name));
  }
  assert.doesNotMatch(legacyActions, /\.update\(pageSections\)|\.insert\(pageSectionItems\)|\.update\(pageSectionItems\)|\.delete\(pageSectionItems\)/);
});

test("global public revalidation includes CMS-managed legal pages", () => {
  assert.match(legacyActions, /"\/politica-de-privacidade"/);
  assert.match(legacyActions, /"\/termos-e-condicoes"/);
  assert.match(guardedActions, /if \(contract\) revalidatePath\(contract\.route\)/);
});
