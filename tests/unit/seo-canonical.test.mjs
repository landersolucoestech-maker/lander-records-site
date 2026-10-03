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


test("metadata builder routes supplied canonical values through canonical normalization",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../lib/seo.ts",import.meta.url),"utf8");assert.match(source,/canonicalInput\?\.startsWith\("\/"\) \? absoluteUrl\(canonicalInput\)/)});


test("site exposes a first-party web manifest with branded icon",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../app/manifest.ts",import.meta.url),"utf8");assert.match(source,/name: "Lander Records"/);assert.match(source,/\/lander-records-logo\.webp/);assert.match(source,/start_url: "\/"/)});


test("robots excludes admin, API and disposable CMS preview surfaces",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../app/robots.ts",import.meta.url),"utf8");for(const path of ["/admin/","/api/","/cms-preview/"])assert.match(source,new RegExp(path.replaceAll("/","\\/")))});


test("public index pages declare route-specific canonical fallbacks",async()=>{const {readFile}=await import("node:fs/promises");for(const [file,route] of [["page.tsx","/"],["artistas/page.tsx","/artistas"],["noticias/page.tsx","/noticias"],["contato/page.tsx","/contato"],["sobre-nos/page.tsx","/sobre-nos"],["politica-de-privacidade/page.tsx","/politica-de-privacidade"],["termos-e-condicoes/page.tsx","/termos-e-condicoes"]]){const source=await readFile(new URL(`../../app/(public)/${file}`,import.meta.url),"utf8");assert.match(source,new RegExp(`canonical: content\\?\\.page\\.canonicalUrl \\|\\| "${route.replaceAll("/","\\/")}"`));}});

test("article metadata prefers the dedicated social image over the cover",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../app/(public)/noticias/[slug]/page.tsx",import.meta.url),"utf8");assert.match(source,/image: article\.ogImage \|\| article\.coverImage \|\| undefined/);});