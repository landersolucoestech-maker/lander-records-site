import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("tags are managed as a real persistent taxonomy", () => {
  const page = read("app/admin/(protected)/tags/page.tsx");
  const actions = read("app/admin/tag-actions.ts");
  const postActions = read("app/admin/post-actions.ts");
  const postManager = read("app/admin/(protected)/posts/PostManager.tsx");
  const repository = read("modules/posts/repository.ts");
  assert.doesNotMatch(page, /redirect\(/);
  assert.match(page, /select\(\)\.from\(tags\)/);
  assert.match(page, /action=\{upsertTag\}/);
  assert.match(actions, /requirePersistentAdmin\("editor"\)/);
  assert.match(actions, /requirePersistentAdmin\("admin"\)/);
  assert.match(actions, /from "\.\.\/\.\.\/lib\/auth"/);
  assert.match(actions, /tag\.created/);
  assert.match(actions, /tag\.deleted/);
  assert.match(actions, /postTags\.tagId/);
  assert.match(actions, /associada a publicações/);
  assert.match(actions, /revalidatePath\("\/admin\/posts"\)/);
  assert.match(postActions, /formData\.getAll\("tagIds"\)/);
  assert.match(postActions, /insert\(postTags\)/);
  assert.match(postManager, /multiple name="tagIds"/);
  assert.match(repository, /innerJoin\(tags/);
});
