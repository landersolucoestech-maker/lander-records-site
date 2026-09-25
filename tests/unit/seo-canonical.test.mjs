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

test("static public pages never inherit the homepage canonical", async () => {
  const fs = await import("node:fs");
  const routes = {
    "app/(public)/page.tsx": "/",
    "app/(public)/sobre-nos/page.tsx": "/sobre-nos",
    "app/(public)/artistas/page.tsx": "/artistas",
    "app/(public)/noticias/page.tsx": "/noticias",
    "app/(public)/contato/page.tsx": "/contato",
    "app/(public)/politica-de-privacidade/page.tsx": "/politica-de-privacidade",
    "app/(public)/termos-e-condicoes/page.tsx": "/termos-e-condicoes",
  };
  for (const [file, route] of Object.entries(routes)) {
    const source = fs.readFileSync(file, "utf8");
    assert.ok(source.includes(`canonical: resolveCanonicalUrl(content?.page.canonicalUrl, "${route}")`), file);
  }
  const seo = fs.readFileSync("lib/seo.ts", "utf8");
  assert.doesNotMatch(seo, /input\.canonical \|\| absoluteUrl\("\/"\)/, "buildMetadata must not default canonicals to the homepage");
  assert.match(seo, /canonical: string;/);
});

test("sitemap lists the served trailing-slash URLs instead of redirecting forms", async () => {
  const fs = await import("node:fs");
  const { absolutePageUrl } = await import("../../lib/seo.ts");
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://landerrecords.com";
  try {
    assert.equal(absolutePageUrl("/"), "https://landerrecords.com/");
    assert.equal(absolutePageUrl("/contato"), "https://landerrecords.com/contato/");
    assert.equal(absolutePageUrl("/artistas/nome/"), "https://landerrecords.com/artistas/nome/");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
  assert.match(fs.readFileSync("next.config.mjs", "utf8"), /trailingSlash: true/);
  const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
  assert.doesNotMatch(sitemap, /absoluteUrl\(/);
  assert.match(sitemap, /absolutePageUrl\(`\/artistas\/\$\{artist\.slug\}`\)/);
});
