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


test("not-found boundary gives users an explicit recovery path",async()=>{const source=await readFile(new URL("../../app/not-found.tsx",import.meta.url),"utf8");assert.match(source,/Página não encontrada/);assert.match(source,/href="\/"|href=\{"\/"\}|href="\/" /);assert.match(source,/Voltar para o início/)});


test("integration cron compares bearer secrets in constant time",async()=>{const source=await readFile(new URL("../../app/api/cron/integrations/route.ts",import.meta.url),"utf8");assert.match(source,/safeCompare\(actual\.slice\(7\), secret\)/);assert.doesNotMatch(source,/authorization\"\) !==/)});


test("protected admin has a non-leaking recovery boundary",async()=>{const source=await readFile(new URL("../../app/admin/(protected)/error.tsx",import.meta.url),"utf8");assert.match(source,/Tentar novamente/);assert.match(source,/reset\(\)/);assert.doesNotMatch(source,/error\.(message|stack|digest)/);});

test("cron endpoint does not expose missing secret configuration details",async()=>{const cron=await readFile(new URL("../../app/api/cron/integrations/route.ts",import.meta.url),"utf8");assert.doesNotMatch(cron,/CRON_SECRET not configured/);assert.match(cron,/if \(!secret\) return NextResponse\.json\(\{ ok: false \}, \{ status: 503 \}\)/);});