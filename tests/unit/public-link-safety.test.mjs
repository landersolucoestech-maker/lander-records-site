import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { trustedExternalHref, trustedInternalHref, trustedPublicLink } from "../../lib/public-link.ts";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const chrome = read("app/components/SiteChrome.tsx");
const mobile = read("app/components/MobileNavigation.tsx");
const artist = read("app/(public)/artistas/[slug]/page.tsx");

test("trusted internal links remain same-origin routes only", () => {
  assert.equal(trustedInternalHref("/artistas?ordem=1#casting"), "/artistas?ordem=1#casting");
  assert.equal(trustedInternalHref("/"), "/");
  for (const value of ["//evil.example", "javascript:alert(1)", "https://example.com", "/artistas\\evil", "/artistas\u0000evil", ""] ) {
    assert.equal(trustedInternalHref(value), "");
  }
});

test("trusted external links require credential-free HTTPS", () => {
  assert.equal(trustedExternalHref("https://example.com/path"), "https://example.com/path");
  for (const value of ["http://example.com", "javascript:alert(1)", "//example.com", "https://user:secret@example.com", "https://example.com/a\\b", "https://example.com/a\u0007b", "not a url"]) {
    assert.equal(trustedExternalHref(value), "");
  }
});

test("public link resolver distinguishes safe internal and external destinations", () => {
  assert.deepEqual(trustedPublicLink("/contato"), { href: "/contato", external: false });
  assert.deepEqual(trustedPublicLink("https://example.com"), { href: "https://example.com/", external: true });
  assert.equal(trustedPublicLink("javascript:alert(1)"), null);
});

test("desktop, footer and mobile navigation resolve persisted links through the trusted boundary", () => {
  assert.match(chrome, /trustedPublicLink\(href\)/);
  assert.match(chrome, /trustedExternalHref\(href\)/);
  assert.match(mobile, /trustedPublicLink\(item\.url\)/);
  assert.doesNotMatch(mobile, /href=\{item\.url\}/);
});

test("artist public links and sameAs metadata expose only trusted external URLs", () => {
  assert.match(artist, /trustedArtistLinks = artist\.links/);
  assert.match(artist, /trustedExternalUrl\(link\.url\)/);
  assert.match(artist, /sameAs: trustedArtistLinks\.map/);
  assert.doesNotMatch(artist, /href=\{link\.url\}/);
});
