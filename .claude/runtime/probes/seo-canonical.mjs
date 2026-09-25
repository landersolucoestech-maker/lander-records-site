#!/usr/bin/env node
// For every sitemap URL of the running site (OS_BASE_URL): the path must answer 200 without redirect
// and declare itself as canonical. Site origin in canonical/sitemap = NEXT_PUBLIC_SITE_URL of the server.
const base = process.env.OS_BASE_URL;
if (!base) { console.error("OS_BASE_URL not set"); process.exit(77); }
const get = (url) => fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
const sitemap = await (await get(new URL("/sitemap.xml", base))).text();
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const failures = [];
for (const loc of locs) {
  const { pathname } = new URL(loc);
  const response = await get(new URL(pathname, base));
  if (response.status !== 200) { failures.push(`${pathname}: HTTP ${response.status}`); continue; }
  const canonical = (await response.text()).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== loc) failures.push(`${pathname}: canonical ${canonical ?? "(none)"} != sitemap ${loc}`);
}
console.log(JSON.stringify({ checked: locs.length, failures }, null, 2));
process.exit(locs.length && !failures.length ? 0 : 1);
