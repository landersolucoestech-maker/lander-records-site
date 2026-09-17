import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) {
  return readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("every exported admin editor loader revalidates editor authorization", async () => {
  for (const relativePath of [
    "app/admin/(protected)/artists/editor-data.ts",
    "app/admin/(protected)/posts/editor-data.ts",
  ]) {
    const contents = await source(relativePath);
    const exportedLoaders = [...contents.matchAll(/export async function (load\w+)\([^)]*\)\s*\{([\s\S]*?)(?=\nexport async function|\n}$)/g)];
    assert.ok(exportedLoaders.length > 0, `${relativePath} must expose loader functions`);
    for (const [, name, body] of exportedLoaders) {
      assert.match(body, /await requireAdmin\("editor"\);/, `${name} must authorize before reading admin data`);
      assert.ok(body.indexOf('await requireAdmin("editor");') < body.indexOf("getDb()"), `${name} must authorize before database access`);
    }
  }
});

test("password change denies a missing or invalid session before database access", async () => {
  const contents = await source("app/admin/actions.ts");
  const match = contents.match(/export async function changeOwnPassword\([^)]*\)\s*\{([\s\S]*?)\n}\n\nexport async function upsertArtistCategory/);
  assert.ok(match, "changeOwnPassword action must exist");
  const body = match[1];
  assert.match(body, /const session = await getAdminSession\(\);\s*if \(!session\) redirect\("\/admin\/login"\);/);
  assert.ok(body.indexOf("if (!session)") < body.indexOf("getDb()"), "session must be denied before database access");
});

test("logout never performs a privileged mutation for an unauthenticated visitor", async () => {
  const contents = await source("app/admin/actions.ts");
  const match = contents.match(/export async function logoutAction\(\)\s*\{([\s\S]*?)\n}\n\nexport async function changeOwnPassword/);
  assert.ok(match, "logoutAction must exist");
  const body = match[1];
  assert.match(body, /if \(session\) await audit/);
  assert.doesNotMatch(body, /getDb\(\)|adminUsers|\.update\(|\.insert\(/);
  assert.match(body, /destroyAdminSession\(\)/);
});

test("Spotify callback requires an editor authorization decision", async () => {
  const contents = await source("app/api/integrations/spotify/callback/route.ts");
  assert.match(contents, /const session = await requireAdmin\("editor"\);/);
  assert.doesNotMatch(contents, /getAdminSession/);
});

test("Spotify OAuth rejects a development-only principal without a persistent user", async () => {
  for (const relativePath of [
    "app/api/integrations/spotify/connect/route.ts",
    "app/api/integrations/spotify/callback/route.ts",
  ]) {
    const contents = await source(relativePath);
    const syntheticGuard = contents.indexOf('session.source === "development-auth-bypass"');
    const oauthSideEffect = Math.min(
      ...["createSpotifyAuthorizationUrl(", "completeSpotifyAuthorization("]
        .map((needle) => contents.indexOf(needle))
        .filter((index) => index >= 0),
    );
    assert.ok(syntheticGuard >= 0, `${relativePath} must reject an in-memory principal`);
    assert.ok(syntheticGuard < oauthSideEffect, `${relativePath} must reject before OAuth state side effects`);
  }
});

test("every privileged admin mutation requires a persistent administrator session", async () => {
  for (const relativePath of [
    "app/admin/actions.ts",
    "app/admin/artist-actions.ts",
    "app/admin/post-actions.ts",
    "app/admin/page-actions.ts",
    "app/admin/integration-actions.ts",
  ]) {
    const contents = await source(relativePath);
    assert.match(contents, /requirePersistentAdmin/);
    assert.doesNotMatch(contents, /\brequireAdmin\b/);
    assert.ok(contents.match(/await requirePersistentAdmin\(/g)?.length, `${relativePath} must guard privileged operations`);
  }
});

test("admin status uses API authorization semantics instead of page redirects", async () => {
  const contents = await source("app/api/admin/status/route.ts");
  assert.match(contents, /getAdminAuthorization/);
  assert.match(contents, /status: 401/);
  assert.match(contents, /status: 403/);
  assert.doesNotMatch(contents, /requireAdmin|redirect\(/);
});

test("Home manager authorizes before loading any administrative data", async () => {
  const contents = await source("app/admin/(protected)/home/page.tsx");
  const authorization = contents.indexOf("await requireAdmin()");
  const reads = ["getPageContent(\"home\")", "getPublishedArtists(true)", "getPublishedPosts(true)", "getCachedSpotifyReleases()", "getLanderRecordsSocialMetrics()"];
  assert.ok(authorization >= 0, "Home manager must revalidate the session on the server");
  for (const read of reads) {
    assert.ok(contents.indexOf(read) > authorization, `${read} must run only after authorization`);
  }
});

test("Artists manager authorizes before opening the administrative read model", async () => {
  const contents = await source("app/admin/(protected)/artists/page.tsx");
  const authorization = contents.indexOf("await requireAdmin()");
  const database = contents.indexOf("getDb()");
  assert.ok(authorization >= 0, "Artists manager must revalidate the session on the server");
  assert.ok(database > authorization, "Artists manager must authorize before database access");
});

test("News manager authorizes before opening the administrative read model", async () => {
  const contents = await source("app/admin/(protected)/posts/page.tsx");
  const authorization = contents.indexOf("await requireAdmin()");
  const database = contents.indexOf("getDb()");
  assert.ok(authorization >= 0, "News manager must revalidate the session on the server");
  assert.ok(database > authorization, "News manager must authorize before database access");
});

test("Pages routes authorize before opening administrative read models", async () => {
  for (const [relativePath, guard] of [
    ["app/admin/(protected)/pages/page.tsx", "await requireAdmin()"],
    ["app/admin/(protected)/pages/[id]/page.tsx", 'await requireAdmin("editor")'],
    ["app/admin/(protected)/pages/[id]/view/page.tsx", "await requireAdmin()"],
  ]) {
    const contents = await source(relativePath);
    const authorization = contents.indexOf(guard);
    const database = contents.indexOf("getDb()");
    assert.ok(authorization >= 0, `${relativePath} must explicitly authorize`);
    assert.ok(database > authorization, `${relativePath} must authorize before database access`);
  }
});

test("Navigation manager authorizes before opening its administrative read model", async () => {
  const contents = await source("app/admin/(protected)/navigation/page.tsx");
  const authorization = contents.indexOf("await requireAdmin()");
  const database = contents.indexOf("getDb()");
  assert.ok(authorization >= 0, "Navigation manager must explicitly authorize");
  assert.ok(database > authorization, "Navigation manager must authorize before database access");
});

test("Header manager authorizes before loading the public chrome read model", async () => {
  const contents = await source("app/admin/(protected)/header/page.tsx");
  const authorization = contents.indexOf("await requireAdmin()");
  const chromeRead = contents.indexOf("await getSiteChrome()");
  assert.ok(authorization >= 0, "Header manager must explicitly authorize");
  assert.ok(chromeRead > authorization, "Header manager must authorize before reading Header sources");
});

test("Navigation mutations preserve editor/admin RBAC and validate before writes", async () => {
  const contents = await source("app/admin/actions.ts");
  const upsert = contents.match(/export async function upsertNavigationItem[\s\S]*?(?=\nexport async function deleteNavigationItem)/)?.[0] || "";
  const removal = contents.match(/export async function deleteNavigationItem[\s\S]*?(?=\nexport async function updateSiteSettings)/)?.[0] || "";
  assert.match(upsert, /requirePersistentAdmin\("editor"\)/);
  assert.match(removal, /requirePersistentAdmin\("admin"\)/);
  assert.ok(upsert.indexOf("navigationDestinationError") < upsert.indexOf("tx.update"));
  assert.ok(upsert.indexOf("navigationHierarchyError") < upsert.indexOf("tx.update"));
  assert.ok(upsert.indexOf("pg_advisory_xact_lock") < upsert.indexOf("tx.update"));
  assert.ok(removal.indexOf("pg_advisory_xact_lock") < removal.indexOf("tx.delete"));
  assert.ok(removal.indexOf("navigationDeletionError") < removal.indexOf("tx.delete"));
  assert.doesNotMatch(removal, /confirmCascade/);
});

test("admin user mutations validate role and identifiers at the authoritative boundary", async () => {
  const contents = await source("app/admin/actions.ts");
  const create = contents.match(/export async function createAdminUser[\s\S]*?(?=\nexport async function updateAdminUser)/)?.[0] || "";
  const update = contents.match(/export async function updateAdminUser[\s\S]*?(?=\nexport async function resetAdminPassword)/)?.[0] || "";
  const reset = contents.match(/export async function resetAdminPassword[\s\S]*$/)?.[0] || "";
  assert.match(create, /requirePersistentAdmin\("owner"\)/);
  assert.match(create, /isAdminRole\(roleValue\)/);
  assert.match(create, /assertAdminIdentity\(name, email\)/);
  assert.match(update, /requirePersistentAdmin\("owner"\)/);
  assert.match(update, /requiredUuid\(formData, "id", "Usuário"\)/);
  assert.match(update, /isAdminRole\(roleValue\)/);
  assert.match(reset, /requirePersistentAdmin\("owner"\)/);
  assert.match(reset, /requiredUuid\(formData, "id", "Usuário"\)/);
});

test("social links are normalized inside the privileged server action", async () => {
  const contents = await source("app/admin/actions.ts");
  const mutation = contents.match(/export async function upsertSocialLink[\s\S]*?(?=\nexport async function upsertContactTopic)/)?.[0] || "";
  assert.match(mutation, /requirePersistentAdmin\("editor"\)/);
  assert.match(mutation, /normalizeExternalUrl\(text\(formData, "url"\)\)/);
  assert.ok(mutation.indexOf("normalizeExternalUrl") < mutation.indexOf("db.update"), "URL validation must happen before persistence");
});

test("retired parallel admin mutations cannot reintroduce duplicate write paths", async () => {
  const contents = await source("app/admin/actions.ts");
  for (const name of [
    "createArtist",
    "updateArtist",
    "setArtistPublication",
    "archiveArtist",
    "addArtistLink",
    "deleteArtistLink",
    "addArtistEmbed",
    "deleteArtistEmbed",
    "createPost",
    "updatePost",
    "setPostPublication",
    "upsertTag",
    "deleteTag",
    "upsertRelease",
    "updatePage",
    "updateContactStatus",
    "retryContactDelivery",
  ]) {
    assert.doesNotMatch(contents, new RegExp(`export async function ${name}\\b`), `${name} must stay retired`);
  }
});
