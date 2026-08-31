import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../../app/admin/components/HomeManagerView.tsx", import.meta.url), "utf8");

test("Home manager keeps the eight implemented blocks and omits unsupported controls", () => {
  for (const key of ["hero", "intro", "social", "shortcuts", "artists", "releases", "advertising", "news"]) {
    assert.match(source, new RegExp(`key: [\"']${key}[\"']`));
  }
  assert.doesNotMatch(source, /Publicar alterações|Adicionar nova seção futura|draggable|onDrag/i);
  assert.match(source, /A reordenação ainda não é suportada/);
});
