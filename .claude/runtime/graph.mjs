#!/usr/bin/env node
// graph.mjs [build|check]   Extracts knowledge graphs from the real source tree into .claude/graphs/.
// build: regenerate. check: fail if graphs are stale or a curated flow references code that no longer exists.
import fs from "node:fs";
import path from "node:path";
import { args, run, OsError, REPO_ROOT, osPath, walk, rel, writeJson, readJson } from "./lib/io.mjs";

const SOURCE_DIRS = ["app", "lib", "modules", "scripts"];
const CODE = /\.(ts|tsx|mjs)$/;
const files = () => SOURCE_DIRS.flatMap((d) => walk(path.join(REPO_ROOT, d), (f) => CODE.test(f))).concat([path.join(REPO_ROOT, "proxy.ts")]).filter((f) => fs.existsSync(f)).sort();

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(REPO_ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function routeOf(file) {
  const r = rel(file);
  const m = r.match(/^app\/(.*)\/(page|route)\.tsx?$/) || (r.match(/^app\/(page)\.tsx$/) ? [r, "", "page"] : null);
  if (!m) return null;
  const segments = m[1].split("/").filter((s) => s && !/^\(.*\)$/.test(s));
  return { path: `/${segments.join("/")}${segments.length ? "/" : ""}`.replace(/\/+/g, "/"), kind: m[2] === "route" ? "api" : "page", file: r, methods: m[2] === "route" ? [...fs.readFileSync(file, "utf8").matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map((x) => x[1]) : ["GET"] };
}

const PROVIDER_HOSTS = { soundcharts: /soundcharts\.com/, spotify: /(api|accounts)\.spotify\.com/, "supabase-storage": /@supabase\/supabase-js/, "saas-webhook": /LANDER_SAAS_WEBHOOK_URL/, youtube: /youtube(-nocookie)?\.com\/embed|YOUTUBE_HOSTS/ };
const TABLE_EXPORT = /export const (\w+) = pgTable\("(\w+)"/g;

function build() {
  const all = files();
  const tables = new Map();
  for (const f of all.filter((x) => rel(x).startsWith("lib/db/"))) for (const m of fs.readFileSync(f, "utf8").matchAll(TABLE_EXPORT)) tables.set(m[1], { table: m[2], file: rel(f) });

  const dependencies = { nodes: [], edges: [] };
  const symbols = {};
  const dataFlows = { tables: Object.fromEntries([...tables.values()].map((t) => [t.table, { definedIn: t.file, readers: [], writers: [] }])) };
  const integrations = {};
  for (const f of all) {
    const text = fs.readFileSync(f, "utf8");
    const r = rel(f);
    dependencies.nodes.push(r);
    for (const m of text.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^"']*?\sfrom\s+)?["']([^"']+)["']/g)) {
      const target = resolveImport(f, m[1]);
      if (target) dependencies.edges.push([r, rel(target)]);
    }
    const exported = [...text.matchAll(/export (?:async )?(?:function|const|class|type) (\w+)/g)].map((m) => m[1]);
    if (exported.length) symbols[r] = exported;
    for (const [identifier, info] of tables) {
      if (!new RegExp(`\\b${identifier}\\b`).test(text) || info.file === r) continue;
      const writes = new RegExp(`(insert|update|delete)\\(${identifier}\\)`).test(text);
      const reads = new RegExp(`from\\(${identifier}\\)|\\.join\\(${identifier}|Join\\(${identifier}`).test(text);
      if (writes) dataFlows.tables[info.table].writers.push(r);
      if (reads || !writes) dataFlows.tables[info.table].readers.push(r);
    }
    for (const [provider, regex] of Object.entries(PROVIDER_HOSTS)) if (regex.test(text)) (integrations[provider] ||= []).push(r);
  }
  const routes = all.map(routeOf).filter(Boolean).sort((a, b) => a.path.localeCompare(b.path));
  const tests = walk(path.join(REPO_ROOT, "tests"), (f) => /\.(mjs|cjs|ts)$/.test(f));
  const coverage = {};
  for (const t of tests) {
    const text = fs.readFileSync(t, "utf8");
    for (const m of text.matchAll(/["'`](?:\.\.\/)*((?:app|lib|modules|scripts|migrations)\/[^"'`]+?\.(?:ts|tsx|mjs|sql))["'`]/g)) (coverage[m[1]] ||= new Set()).add(rel(t));
  }
  const covered = Object.fromEntries(Object.entries(coverage).map(([k, v]) => [k, [...v].sort()]));
  const uncoveredCritical = ["lib/contact.ts", "lib/contact-client-ip.ts", "lib/contact-outbox-policy.ts", "lib/integrations/sync.ts", "lib/integrations/soundcharts.ts", "lib/integrations/spotify.ts", "lib/integrations/identity.ts", "lib/seo.ts", "app/api/contact/route.ts", "app/api/cron/integrations/route.ts"].filter((f) => !covered[f]);
  return {
    "dependencies.json": { generatedBy: ".claude/runtime/graph.mjs", nodes: dependencies.nodes.length, edges: dependencies.edges.sort() },
    "symbols.json": { generatedBy: ".claude/runtime/graph.mjs", symbols },
    "routes.json": { generatedBy: ".claude/runtime/graph.mjs", routes },
    "data-flows.json": { generatedBy: ".claude/runtime/graph.mjs", ...Object.fromEntries(Object.entries(dataFlows).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([t, x]) => [t, { ...x, readers: [...new Set(x.readers)].sort(), writers: [...new Set(x.writers)].sort() }]))])) },
    "integrations.json": { generatedBy: ".claude/runtime/graph.mjs", touchpoints: Object.fromEntries(Object.entries(integrations).map(([k, v]) => [k, v.sort()])) },
    "test-coverage.json": { generatedBy: ".claude/runtime/graph.mjs", coveredFiles: covered, uncoveredCritical },
  };
}

/** Curated semantic flows (graphs/*.flow.json) must reference files that exist. */
function checkCurated() {
  const errors = [];
  for (const file of fs.readdirSync(osPath("graphs")).filter((n) => n.endsWith(".flow.json"))) {
    const flow = readJson(osPath("graphs", file));
    for (const node of flow.nodes) for (const ref of node.code || []) {
      const [p, symbol] = ref.split("#");
      const full = path.join(REPO_ROOT, p);
      if (!fs.existsSync(full)) errors.push(`${file}: ${node.id} -> missing ${p}`);
      else if (symbol && !fs.readFileSync(full, "utf8").includes(symbol)) errors.push(`${file}: ${node.id} -> ${p} no longer contains ${symbol}`);
    }
    const ids = new Set(flow.nodes.map((n) => n.id));
    for (const [from, , to] of flow.edges) if (!ids.has(from) || !ids.has(to)) errors.push(`${file}: edge ${from}->${to} references unknown node`);
  }
  return errors;
}

run(() => {
  const a = args();
  const command = a._[0] || "build";
  const graphs = build();
  if (command === "build") {
    for (const [name, value] of Object.entries(graphs)) writeJson(osPath("graphs", name), value);
    const errors = checkCurated();
    if (errors.length) throw new OsError("GRAPH_DRIFT", "curated flows reference missing code", { errors });
    console.log(`graphs written: ${Object.keys(graphs).join(", ")}`);
    return;
  }
  if (command === "check") {
    const stale = Object.entries(graphs).filter(([name, value]) => !fs.existsSync(osPath("graphs", name)) || JSON.stringify(readJson(osPath("graphs", name))) !== JSON.stringify(value)).map(([n]) => n);
    const errors = [...checkCurated(), ...stale.map((n) => `graphs/${n} is stale (run graph.mjs build)`)];
    if (errors.length) throw new OsError("GRAPH_DRIFT", `${errors.length} graph issue(s)`, { errors });
    console.log("GRAPHS_CURRENT=PASS");
    return;
  }
  throw new OsError("USAGE", "graph.mjs build|check");
});
