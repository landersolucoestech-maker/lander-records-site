import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const primitives = read("styles/admin/primitives.css");
const artistCss = read("app/admin/(protected)/artists/ArtistManager.module.css");
const postCss = read("app/admin/(protected)/posts/NewsManager.module.css");
const pickerCss = read("app/admin/components/AdminMediaPicker.module.css");
const mediaLibrary = read("app/admin/(protected)/media/MediaLibrary.tsx");
const pageManager = read("app/admin/(protected)/pages/PageManager.tsx");
const artistManager = read("app/admin/(protected)/artists/ArtistManager.tsx");
const postManager = read("app/admin/(protected)/posts/PostManager.tsx");
const mediaPicker = read("app/admin/components/AdminMediaPicker.tsx");

test("shared admin dialogs keep header/footer fixed while the body owns vertical scroll", () => {
  assert.match(primitives, /\.adminDialog\s*\{[^}]*min-height:\s*0[^}]*max-height:\s*calc\(100dvh - 36px\)[^}]*overflow:\s*hidden/);
  assert.match(primitives, /\.adminDialogBody\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/);
  assert.match(primitives, /\.adminDialogBackdrop\s*\{[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/);
  assert.match(mediaLibrary, /<AdminDialog/);
  assert.match(pageManager, /<AdminDialog/);
});

test("artist create edit and view dialogs expose a shrinkable scrolling content track", () => {
  assert.match(artistManager, /role="dialog"/);
  assert.match(artistCss, /\.viewDialog\{grid-template-rows:auto minmax\(0,1fr\) auto\}/);
  assert.match(artistCss, /\.editDialog\{grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(artistCss, /\.viewBody\{[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
  assert.match(artistCss, /\.editBody\{[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
});

test("content editor and preview dialogs scroll their inner content instead of the locked page", () => {
  assert.match(postManager, /role="dialog"/);
  assert.match(postCss, /\.modalForm\{display:flex;min-height:0;overflow:hidden;flex-direction:column\}/);
  assert.match(postCss, /\.modalBody\{[^}]*flex:1 1 auto[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
  assert.match(postCss, /\.viewDialog\{[^}]*grid-template-rows:auto minmax\(0,1fr\) auto[^}]*max-height:calc\(100dvh - 36px\)/);
  assert.match(postCss, /\.viewPreview\{[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
});

test("media picker remains scrollable when nested inside another editor dialog", () => {
  assert.match(mediaPicker, /role="dialog"/);
  assert.match(pickerCss, /\.dialog\{[^}]*grid-template-rows:auto auto minmax\(0,1fr\)[^}]*min-height:0[^}]*100dvh/);
  assert.match(pickerCss, /\.body\{min-height:0;overflow-y:auto;overscroll-behavior:contain/);
  assert.match(pickerCss, /\.backdrop\{[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
});
