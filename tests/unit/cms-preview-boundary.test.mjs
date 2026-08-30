import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("app/cms-preview/AdminPreview.tsx", "utf8");
const page = readFileSync("app/cms-preview/[[...section]]/page.tsx", "utf8");
const layout = readFileSync("app/cms-preview/layout.tsx", "utf8");

test("CMS preview is guarded twice and has no backend imports", () => {
  assert.match(page, /process\.env\.NODE_ENV !== "development"/);
  assert.match(layout, /process\.env\.NODE_ENV !== "development"/);
  const source = `${component}\n${page}\n${layout}`;
  for (const forbidden of ["lib/db", "lib/auth", "db/schema", "admin/actions", "fetch(", '"use server"']) {
    assert.equal(source.includes(forbidden), false, `preview must not contain ${forbidden}`);
  }
});

test("CMS preview exposes only inert controls and isolated routes", () => {
  assert.doesNotMatch(component, /<form|formAction=|action=/);
  assert.match(component, /href="\/admin\/login"/);
  assert.equal((component.match(/\/admin\//g) || []).length, 1, "only the explicit real-login link may target /admin");
  assert.match(component, /data-preview-only="true"/);
  assert.match(component, /BACKEND_ENVIRONMENT_DEFERRED/);
  assert.match(component, /disabled>Editar visual/);
});
