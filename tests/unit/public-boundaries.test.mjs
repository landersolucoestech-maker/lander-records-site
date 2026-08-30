import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public error boundary exposes recovery without internal error details", async () => {
  const [source, globalSource] = await Promise.all([
    readFile(new URL("../../app/(public)/error.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/global-error.tsx", import.meta.url), "utf8"),
  ]);
  for (const boundary of [source, globalSource]) {
    assert.match(boundary, /Tentar novamente/);
    assert.match(boundary, /reset\(\)/);
    assert.doesNotMatch(boundary, /error\.(message|stack|digest)/);
  }
  assert.match(source, /href="\/"/);
  assert.match(globalSource, /<html lang="pt-BR">/);
  assert.match(globalSource, /href="\/"/);
});

test("dynamic catalog loading states are inline and accessible", async () => {
  const [component, artists, news] = await Promise.all([
    readFile(new URL("../../app/components/PublicRouteLoading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/(public)/artistas/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/(public)/noticias/loading.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(artists, /Carregando artistas/);
  assert.match(news, /Carregando notícias/);
});
