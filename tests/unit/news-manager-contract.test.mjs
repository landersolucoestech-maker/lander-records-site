import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../../app/admin/(protected)/posts/page.tsx", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../../app/admin/(protected)/posts/PostManager.tsx", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../../app/cms-preview/AdminPreview.tsx", import.meta.url), "utf8");
const pagination = fs.readFileSync(new URL("../../app/admin/components/AdminPagination.tsx", import.meta.url), "utf8");

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
  assert.match(manager, /AdminPagination/);
  assert.match(pagination, /Por página/);
  assert.match(pagination, /paginationItems/);
  assert.match(manager, /adminMetricGrid/);
  assert.match(manager, /Conteúdos<\/span><strong>\{metrics\.total/);
  assert.match(manager, /Publicados<\/span><strong>\{metrics\.published/);
  assert.match(manager, /Rascunhos<\/span><strong>\{metrics\.draft/);
  assert.match(manager, /Arquivados<\/span><strong>\{metrics\.archived/);
  assert.match(manager, /Buscar por título, slug ou autor/);
  assert.match(manager, /Filtrar por status/);
  assert.match(manager, /Filtrar por categoria/);
  assert.match(manager, /Filtrar por autor/);
  assert.match(manager, /Ordenar conteúdos/);
  assert.match(manager, /const filteredPosts = useMemo/);
  assert.match(manager, /totalItems=\{filteredPosts\.length\}/);
  assert.match(manager, /unpublished: "Não publicado"/);
  assert.doesNotMatch(manager, /Agendad[ao]|Analytics|Mais filtros/);
});

test("News preview is fixture-only and imports no write primitive", () => {
  assert.match(preview, /previewPosts/);
  assert.doesNotMatch(preview, /post-actions|savePostAction|deletePostAction/);
});
