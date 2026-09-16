import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const actions = fs.readFileSync(new URL("../../app/admin/post-actions.ts", import.meta.url), "utf8");

test("post image preparation is sequential so earlier uploads can be compensated", () => {
  assert.match(actions, /coverUpload = await prepareImage\(formData, "coverMediaUpload", slug, "cover"\)/);
  assert.match(actions, /authorUpload = await prepareImage\(formData, "authorMediaUpload", slug, "author"\)/);
  assert.doesNotMatch(actions, /\[coverUpload, authorUpload\] = await Promise\.all/);
});

test("failed post image preparation and failed transactions clean prepared storage objects", () => {
  assert.match(actions, /deleteMedia as deleteStoredMedia/);
  assert.match(actions, /storageKey: stored\.key/);
  assert.match(actions, /async function cleanupPreparedUploads/);
  assert.match(actions, /Promise\.allSettled/);
  const cleanupCalls = actions.match(/await cleanupPreparedUploads\(coverUpload, authorUpload\)/g) || [];
  assert.equal(cleanupCalls.length, 2, "cleanup must run after preparation failure and transaction failure");
});

test("successful post saves keep uploaded media and return to the modal edit workflow", () => {
  const auditBoundary = actions.indexOf("await audit(session.user.id, id ? \"post.updated\"");
  assert.ok(auditBoundary > 0);
  const successTail = actions.slice(auditBoundary);
  assert.doesNotMatch(successTail, /cleanupPreparedUploads|deleteStoredMedia/);
  assert.match(successTail, /redirect\(`\/admin\/posts\?edit=\$\{encodeURIComponent\(postId\)\}&saved=1`\)/);
});
