import assert from "node:assert/strict";
import test from "node:test";
import { resolveCanonicalUrl } from "../../lib/seo.ts";

test("canonical URLs use the configured site route when no valid override exists", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://landerrecords.com/";
  try {
    assert.equal(resolveCanonicalUrl("", "/noticias/materia"), "https://landerrecords.com/noticias/materia");
    assert.equal(resolveCanonicalUrl("javascript:alert(1)", "/noticias/materia"), "https://landerrecords.com/noticias/materia");
    assert.equal(resolveCanonicalUrl("https://user:secret@example.com/page", "/noticias/materia"), "https://landerrecords.com/noticias/materia");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("canonical overrides preserve valid HTTP(S) URLs but remove fragments", () => {
  assert.equal(resolveCanonicalUrl("https://example.com/editorial/item#section", "/fallback"), "https://example.com/editorial/item");
  assert.equal(resolveCanonicalUrl("http://example.com/editorial/item", "/fallback"), "http://example.com/editorial/item");
});


test("metadata builder routes supplied canonical values through canonical normalization",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../lib/seo.ts",import.meta.url),"utf8");assert.match(source,/input\.canonical \? resolveCanonicalUrl\(input\.canonical, "\/"\) : absoluteUrl\("\/"\)/)});


test("site exposes a first-party web manifest with branded icon",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../app/manifest.ts",import.meta.url),"utf8");assert.match(source,/name: "Lander Records"/);assert.match(source,/\/lander-records-logo\.webp/);assert.match(source,/start_url: "\/"/)});
