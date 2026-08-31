import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const publicHeader = source("app/components/SiteChrome.tsx");
const mobileHeader = source("app/components/MobileNavigation.tsx");
const content = source("lib/content.ts");
const manager = source("app/admin/(protected)/header/HeaderManagerView.tsx");
const preview = source("app/admin/(protected)/header/HeaderPreview.tsx");
const page = source("app/admin/(protected)/header/page.tsx");
const previewRoot = source("app/cms-preview/AdminPreview.tsx");
const globalCss = source("app/globals.css");
const navigationCss = source("app/navigation-polish.css");

test("Header manager reflects the real hardcoded logo and CTA contracts", () => {
  assert.match(publicHeader, /src="\/lander-records-brand\.svg"/);
  assert.match(publicHeader, /href="\/contato">Quero Contratar/);
  assert.match(mobileHeader, /href="\/contato">Quero Contratar/);
  assert.match(content, /logoUrl: resolvedSettings\.logoMediaId/);
  assert.doesNotMatch(publicHeader, /logoUrl/);
  assert.match(manager, /PUBLIC HEADER LOGO CONSUMPTION — FRONTEND DEFERRED/);
  assert.match(manager, /HEADER CTA CONFIGURATION — BACKEND DEFERRED/);
});

test("Header primary menu is automatic, ordered upstream and root-only in public consumers", () => {
  assert.match(content, /eq\(navigationItems\.enabled, true\)/);
  assert.match(content, /orderBy\(asc\(navigationItems\.menuKey\), asc\(navigationItems\.position\)\)/);
  assert.match(publicHeader, /item\.menuKey === "primary" && !item\.parentId/);
  assert.match(page, /item\.menuKey === "primary" && !item\.parentId/);
  assert.match(publicHeader, /newTab=\{item\.newTab\}/);
  assert.match(mobileHeader, /target=\{item\.newTab \? "_blank" : undefined\}/);
});

test("Header behavior remains structural instead of becoming a theme editor", () => {
  assert.match(globalCss, /\.siteHeader \{ position: fixed/);
  assert.match(globalCss, /@media \(max-width: 980px\)/);
  assert.match(navigationCss, /@media \(max-width: 620px\)/);
  assert.match(navigationCss, /@media \(max-width: 360px\)/);
  assert.doesNotMatch(manager, /<form|type="range"|color picker|Salvar alterações|Abrir em nova aba|Estilo do botão/);
  assert.doesNotMatch(manager, /from "\.\.\/\.\.\/actions"/);
});

test("Header route is server-first and performs one chrome read after authorization", () => {
  assert.doesNotMatch(page, /"use client"/);
  assert.equal((page.match(/getSiteChrome\(\)/g) || []).length, 1);
  assert.ok(page.indexOf("await requireAdmin()") < page.indexOf("await getSiteChrome()"));
  assert.match(preview, /^"use client";/);
});

test("Header preview is isolated, illustrative and reuses the real CMS view", () => {
  assert.match(previewRoot, /validSection === "header" \? <HeaderManagerView data=\{previewHeader\} preview/);
  assert.match(manager, /BACKEND_ENVIRONMENT_DEFERRED/);
  assert.match(preview, /Esta é uma prévia ilustrativa/);
  assert.doesNotMatch(previewRoot + manager + preview, /updateSiteSettings|upsertNavigationItem|fetch\(/);
});
