import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../../app/admin/components/HomeManagerView.tsx", import.meta.url), "utf8");
const pageSource = fs.readFileSync(new URL("../../app/admin/(protected)/home/page.tsx", import.meta.url), "utf8");

test("Home manager keeps the eight implemented blocks and omits unsupported controls", () => {
  for (const key of ["hero", "intro", "social", "shortcuts", "artists", "releases", "advertising", "news"]) {
    assert.match(source, new RegExp(`key: [\\\"']${key}[\\\"']`));
  }
  assert.doesNotMatch(source, /Publicar alterações|Adicionar nova seção futura|draggable|onDrag/i);
  assert.match(source, /A reordenação ainda não é suportada/);
});

test("Home manager reflects the CMS-backed advertising banner", () => {
  assert.match(pageSource, /byKey\("advertise_banner"\)/);
  assert.match(pageSource, /advertiseBanner\?\.mediaUrl/);
  assert.match(pageSource, /actionHref: editSectionHref\(advertiseSection\)/);
  assert.match(source, /section\.imageUrls\?\.\[0\]/);
  assert.doesNotMatch(source, /Edição requer evolução futura/);
});

test("Home manager deep-links CMS-owned section editing and keeps source management separate", () => {
  assert.match(pageSource, /\?section=\$\{encodeURIComponent\(section\.id\)\}/);
  for (const sectionName of ["artistSection", "releaseSection", "newsSection"]) {
    assert.match(pageSource, new RegExp(`actionHref: editSectionHref\\(${sectionName}\\)`));
  }
  assert.match(pageSource, /secondaryActionHref: "\/admin\/artists"/);
  assert.match(pageSource, /secondaryActionHref: "\/admin\/settings\/lander-records"/);
  assert.match(pageSource, /secondaryActionHref: "\/admin\/posts"/);
  assert.match(source, /secondaryActionHref/);
  assert.match(source, /secondaryActionLabel/);
});
