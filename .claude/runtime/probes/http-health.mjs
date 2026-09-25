#!/usr/bin/env node
// Probes the running site's /api/health/ endpoint (OS_BASE_URL, e.g. http://127.0.0.1:3100).
const base = process.env.OS_BASE_URL;
if (!base) { console.error("OS_BASE_URL not set"); process.exit(77); }
const response = await fetch(new URL("/api/health/", base), { signal: AbortSignal.timeout(10_000) }).catch((error) => ({ ok: false, status: 0, error }));
const body = response.json ? await response.json().catch(() => null) : null;
console.log(JSON.stringify({ status: response.status, body }));
process.exit(response.ok && body?.application === "ok" && body?.database === "ok" ? 0 : 1);
