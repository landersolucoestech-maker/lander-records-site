import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/posts/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/posts/PostManager.tsx", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("News read model mirrors the public publication predicate", () => {
  assert.match(page, /status.*published[\s\S]*archivedAt.*IS NULL[\s\S]*publishedAt.*now\(\)[\s\S]*scheduledAt.*now\(\)/);
  assert.match(page, /featuredOnHome: post\.isPubliclyVisible && post\.featuredOnHome/);
  assert.doesNotMatch(page, /post: posts/);
  assert.doesNotMatch(page, /contentMarkdown/);
  assert.match(page, /conditions\.push\(publicPost\)/);
  assert.match(page, /and\(eq\(posts\.status, "draft"\), isNull\(posts\.archivedAt\)\)/);
  assert.match(page, /ilike\(posts\.title, pattern\)/);
  assert.match(page, /WHERE[\s\S]*postTags[\s\S]*tags\.name/);
  assert.match(page, /post\.isPubliclyVisible \? "published"[\s\S]*"unpublished"/);
});

test("News manager omits unsupported editorial features", () => {
  assert.doesNotMatch(manager, /Mais filtros|Agendad[ao]|deletePostAction|paginação|Analytics/);
  assert.match(manager, /Buscar por título, resumo ou autor/);
  assert.match(manager, /status === "unpublished" \? "Não publicada"/);
  assert.match(manager, /if \(!preview\) return posts/);
  assert.match(manager, /Mostrando \{filtered\.length\} de \{counts\.total\} notícias/);
});

test("News preview is fixture-only and imports no write primitive", () => {
  assert.match(preview, /previewPosts/);
  assert.doesNotMatch(preview, /post-actions|savePostAction|deletePostAction/);
});
