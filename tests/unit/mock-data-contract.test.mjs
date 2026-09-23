import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path)=>fs.readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const mocks=[
  "lib/mocks/admin.ts","lib/mocks/artists.ts","lib/mocks/config.ts","lib/mocks/integrations.ts",
  "lib/mocks/media-kit.ts","lib/mocks/media.ts","lib/mocks/posts.ts","lib/mocks/preview.ts","lib/mocks/site.ts",
];
const preview=read("app/cms-preview/AdminPreview.tsx");
const workflow=read(".github/workflows/dev-preview.yml");

test("demo data has one removable centralized root",()=>{
  for(const file of mocks) assert.ok(fs.existsSync(new URL("../../"+file,import.meta.url)),file);
  assert.match(read("lib/mocks/config.ts"),/LANDER_MOCK_DATA/);
  assert.match(workflow,/LANDER_MOCK_DATA:\s*["']?1/);
});

test("central scenario has representative depth across every visible domain",()=>{
  assert.ok((read("lib/mocks/artists.ts").match(/id:\s*["']mock-artist-/g)||[]).length>=7,"artists");
  assert.ok((read("lib/mocks/posts.ts").match(/id:\s*["']mock-post-/g)||[]).length>=10,"posts");
  assert.ok((read("lib/mocks/media.ts").match(/id:\s*["']mock-media-/g)||[]).length>=10,"media");
  assert.ok((read("lib/mocks/media-kit.ts").match(/\bid:/g)||[]).length>=20,"media kit");
  const adminMock = read("lib/mocks/admin.ts");
  const auditActions = adminMock.match(/const actions = \[([\s\S]*?)\];/)?.[1] || "";
  assert.ok((auditActions.match(/["'][^"']+["']/g)||[]).length>=10,"audit");
  assert.match(read("lib/mocks/integrations.ts"),/releases:\s*\[/);
  assert.match(read("lib/mocks/admin.ts"),/series:\s*\[/);
  assert.match(read("lib/mocks/admin.ts"),/devices:\s*\[/);
});

test("public read models switch to centralized demo data without component fixtures",()=>{
  for(const file of [
    "modules/artists/repository.ts","modules/posts/repository.ts","modules/pages/repository.ts",
    "modules/settings/repository.ts","modules/contacts/repository.ts","lib/integrations/sync.ts","lib/news-content.ts",
  ]) assert.match(read(file),/mockDataEnabled/);
});

test("admin data surfaces use the centralized demo scenario",()=>{
  for(const file of [
    "app/admin/(protected)/artists/page.tsx","app/admin/(protected)/posts/page.tsx",
    "app/admin/(protected)/media/page.tsx","app/admin/(protected)/categories/page.tsx",
    "app/admin/(protected)/pages/page.tsx","app/admin/(protected)/pages/[id]/view/page.tsx",
    "app/admin/(protected)/navigation/page.tsx","app/admin/(protected)/settings/page.tsx",
    "app/admin/(protected)/settings/lander-records/page.tsx","app/admin/(protected)/users/page.tsx",
    "app/admin/(protected)/audit/page.tsx","app/admin/(protected)/media-kit/page.tsx",
    "app/admin/(protected)/layout.tsx",
  ]) assert.match(read(file),/mockData|mock[A-Z]/,file);
});

test("cms preview consumes centralized fixtures instead of declaring local mock records",()=>{
  assert.match(preview,/from ["']\.\.\/\.\.\/lib\/mocks["']/);
  for(const residue of ["const previewArtists:","const previewPosts:","const previewPages:","const previewNavigation:","news-preview-1","Artista Aurora"]) {
    assert.ok(!preview.includes(residue),residue);
  }
  assert.match(read("app/admin/components/HomeManagerView.tsx"),/mockPreviewHomeSections/);
});

test("mock mode does not grant persistent write permissions",()=>{
  assert.match(read("app/admin/(protected)/artists/new/page.tsx"),/session\.source !== "session"/);
  assert.match(read("app/admin/(protected)/artists/[id]/page.tsx"),/session\.source !== "session"/);
  assert.match(read("app/admin/(protected)/posts/page.tsx"),/const canEdit = session\.source === "session"/);
  assert.match(read("app/admin/(protected)/pages/page.tsx"),/canEdit=\{session\.source === "session"/);
  assert.match(read("app/admin/(protected)/users/page.tsx"),/const canManage = !mockMode && session\.source === "session"/);
});
