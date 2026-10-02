import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const artistPage = read("app/admin/(protected)/artists/page.tsx");
const artistManager = read("app/admin/(protected)/artists/ArtistManager.tsx");
const artistForm = read("app/admin/(protected)/artists/ArtistForm.tsx");
const artistActions = read("app/admin/artist-actions.ts");
const postPage = read("app/admin/(protected)/posts/page.tsx");
const postManager = read("app/admin/(protected)/posts/PostManager.tsx");
const postActions = read("app/admin/post-actions.ts");

test("mock artist catalog supports isolated add edit view and delete without weakening persistent actions", () => {
  assert.match(artistPage, /<ArtistManager artists=\{mockArtistSummaries\} canDelete canEdit[\s\S]*developmentMode/);
  assert.match(artistManager, /const \[localArtists, setLocalArtists\] = useState\(initialArtists\)/);
  assert.match(artistManager, /const saveLocalArtist = async \(formData: FormData\)/);
  assert.match(artistManager, /const deleteLocalArtist = \(artist: ArtistSummary\)/);
  assert.match(artistManager, /setModal\(\{ mode: "view", artistId: actionArtist\.id \}\)/);
  assert.match(artistManager, /setModal\(\{ mode: "edit", artistId: actionArtist\.id \}\)/);
  assert.match(artistForm, /onLocalSubmit\?: \(formData: FormData\)/);
  assert.match(artistForm, /action=\{onLocalSubmit \?\? action\}/);
  assert.match(artistActions, /requirePersistentAdmin\("editor"\)/);
  assert.match(artistActions, /requirePersistentAdmin\("admin"\)/);
});

test("mock content catalog supports isolated add edit view and delete without weakening persistent actions", () => {
  assert.match(postPage, /canDelete\s+canEdit[\s\S]*developmentMode/);
  assert.match(postManager, /const \[localPosts, setLocalPosts\] = useState\(initialPosts\)/);
  assert.match(postManager, /const saveLocalPost = async \(formData: FormData\)/);
  assert.match(postManager, /const deleteLocalPost = \(post: PostRecord\)/);
  assert.match(postManager, /setModal\(\{ mode: "view", postId: actionPost\.id \}\)/);
  assert.match(postManager, /setModal\(\{ mode: "edit", postId: actionPost\.id \}\)/);
  assert.match(postManager, /action=\{onLocalSubmit \?\? action\}/);
  assert.match(postActions, /requirePersistentAdmin\("editor"\)/);
  assert.match(postActions, /requirePersistentAdmin\("admin"\)/);
});
