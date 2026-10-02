import assert from "node:assert/strict";
import test from "node:test";
import { buildMetadata, resolveCanonicalUrl } from "../../lib/seo.ts";

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


test("metadata builder normalizes invalid canonical input instead of emitting it",async()=>{const previous=process.env.NEXT_PUBLIC_SITE_URL;process.env.NEXT_PUBLIC_SITE_URL="https://landerrecords.com";try{const metadata=await buildMetadata({title:"Teste",canonical:"javascript:alert(1)"});assert.equal(metadata.alternates?.canonical,"https://landerrecords.com/");assert.equal(metadata.openGraph?.url,"https://landerrecords.com/")}finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=previous}});
