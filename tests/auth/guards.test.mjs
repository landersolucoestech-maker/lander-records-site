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
  const match = contents.match(/export async function changeOwnPassword\([^)]*\)\s*\{([\s\S]*?)\n}\n\nexport async function createArtist/);
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
