import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/posts/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/posts/PostManager.tsx", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");

test("News read model mirrors the public publication predicate and category-only taxonomy", () => {
  assert.match(page, /status.*published[\s\S]*archivedAt.*IS NULL[\s\S]*publishedAt.*now\(\)[\s\S]*scheduledAt.*now\(\)/);
  assert.match(page, /isPubliclyVisible: publicPost/);
  assert.match(page, /featuredOnHome: post\.featuredOnHome/);
  assert.match(page, /contentMarkdown: posts\.contentMarkdown/);
  assert.match(page, /conditions\.push\(publicPost\)/);
  assert.match(page, /and\(eq\(posts\.status, "draft"\), isNull\(posts\.archivedAt\)\)/);
  assert.match(page, /ilike\(posts\.title, pattern\)/);
  assert.doesNotMatch(page, /postTags|\btags\b|filters\.tag/);
  assert.match(page, /post\.isPubliclyVisible \? "published"[\s\S]*"unpublished"/);
});

test("News manager exposes the supported modal, actions and pagination workflow", () => {
  assert.match(manager, /function ContentViewDialog/);
  assert.match(manager, /deletePostAction/);
  assert.match(manager, /data-content-action-trigger/);
  assert.match(manager, /data-content-action-menu/);
  assert.match(manager, /const \[pageSize, setPageSize\] = useState\(10\)/);
  assert.match(manager, /Por página/);
  assert.match(manager, /Página <strong>\{safePage\}<\/strong> de/);
  assert.match(manager, /status === "unpublished" \? "Não publicada"/);
  assert.doesNotMatch(manager, /Agendad[ao]|Analytics|Mais filtros/);
});

test("News preview is fixture-only and imports no write primitive", () => {
  assert.match(preview, /previewPosts/);
  assert.doesNotMatch(preview, /post-actions|savePostAction|deletePostAction/);
});
