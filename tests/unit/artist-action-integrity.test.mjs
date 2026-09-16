import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const actions = fs.readFileSync(new URL("../../app/admin/artist-actions.ts", import.meta.url), "utf8");
const publicPage = fs.readFileSync(new URL("../../app/(public)/artistas/[slug]/page.tsx", import.meta.url), "utf8");

test("artist image preparation is sequential so earlier uploads remain available for compensation", () => {
  assert.match(actions, /cardUpload = await prepareArtistImage\(formData, "cardMediaUpload", slug, "card"\)/);
  assert.match(actions, /heroUpload = await prepareArtistImage\(formData, "heroMediaUpload", slug, "hero"\)/);
  assert.doesNotMatch(actions, /\[cardUpload, heroUpload\] = await Promise\.all/);
});

test("failed artist image preparation and failed transactions clean prepared storage objects", () => {
  assert.match(actions, /deleteMedia as deleteStoredMedia/);
  assert.match(actions, /async function cleanupPreparedUploads/);
  assert.match(actions, /Promise\.allSettled/);
  const cleanupCalls = actions.match(/await cleanupPreparedUploads\(cardUpload, heroUpload\)/g) || [];
  assert.equal(cleanupCalls.length, 2, "cleanup must run after preparation failure and transaction failure");
});

test("successful artist saves do not run compensating storage deletion", () => {
  const transactionEnd = actions.indexOf("await audit(session.user.id, id ? \"artist.updated\"");
  assert.ok(transactionEnd > 0);
  const successTail = actions.slice(transactionEnd);
  assert.doesNotMatch(successTail, /cleanupPreparedUploads|deleteStoredMedia/);
});

test("artist public page renders only trusted external links", () => {
  assert.match(publicPage, /trustedArtistLinks/);
  assert.match(publicPage, /trustedExternalUrl\(link\.url\)/);
  assert.doesNotMatch(publicPage, /href=\{link\.url\}/);
  assert.match(publicPage, /sameAs: trustedArtistLinks\.map/);
});
