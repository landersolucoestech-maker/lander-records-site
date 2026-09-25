#!/usr/bin/env node
// sensors.mjs run [--only id,id] [--emit-findings]   Executes sensors/*.json and prints signals.
// SQL sensors are read-only (BEGIN READ ONLY) and need DATABASE_URL; without it they report BLOCKED.
// --emit-findings turns each new signal (by fingerprint) into a DISCOVERED finding.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { args, run, osPath, readJson, REPO_ROOT, walk, rel, sha256, git, nowIso, nextId, writeYml } from "./lib/io.mjs";
import { runCheck } from "./lib/checks.mjs";
import { loadFindings, saveFinding, writeIndex, FINDINGS_DIR } from "./lib/findings.mjs";

async function sqlSensor(sensor) {
  if (!process.env.DATABASE_URL) return { status: "BLOCKED", signals: [], detail: "DATABASE_URL not set" };
  const require = createRequire(path.join(REPO_ROOT, "package.json"));
  const postgres = require("postgres");
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 10 });
  const signals = [];
  try {
    await sql.begin("read only", async (tx) => {
      for (const probe of sensor.probes) {
        const rows = await tx.unsafe(probe.sql);
        if (rows.length) signals.push({ severity: probe.severity, domain: sensor.domain, message: `${probe.message} (${rows.length} row(s))`, sample: rows.slice(0, 5), key: probe.name });
      }
    });
    return { status: signals.length ? "SIGNAL" : "PASS", signals };
  } catch (error) {
    return { status: "BLOCKED", signals: [], detail: `database: ${error.code || error.message}` };
  } finally { await sql.end({ timeout: 5 }); }
}

function envContractSensor(sensor) {
  // A variable is documented when any declared contract document names it (KEY= line or `KEY` mention).
  const documented = new Set();
  for (const doc of sensor.documents || [".env.example"]) {
    const file = path.join(REPO_ROOT, doc);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)) documented.add(m[1]);
    for (const m of text.matchAll(/`([A-Z][A-Z0-9_]+)`/g)) documented.add(m[1]);
  }
  const used = new Map();
  for (const dir of sensor.paths) for (const file of walk(path.join(REPO_ROOT, dir), (f) => /\.(ts|tsx|mjs)$/.test(f))) {
    for (const match of fs.readFileSync(file, "utf8").matchAll(/process\.env\.([A-Z0-9_]+)/g)) if (!used.has(match[1])) used.set(match[1], rel(file));
  }
  const ignore = new Set(sensor.ignore || []);
  const signals = [...used].filter(([name]) => !documented.has(name) && !ignore.has(name)).map(([name, file]) => ({ severity: "P3", domain: sensor.domain, message: `environment variable ${name} is read (${file}) but not documented in ${(sensor.documents || [".env.example"]).join(" / ")}`, key: name }));
  return { status: signals.length ? "SIGNAL" : "PASS", signals };
}

function gitSensor(sensor) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], { allowFail: true });
  const status = git(["status", "--porcelain"], { allowFail: true }).split("\n").filter(Boolean);
  const behind = git(["rev-list", "--count", "HEAD..@{u}"], { allowFail: true });
  const signals = [];
  if (["main", "master"].includes(branch)) signals.push({ severity: "P2", domain: sensor.domain, message: `working directly on ${branch}`, key: "protected-branch" });
  if (behind && Number(behind) > 0) signals.push({ severity: "P3", domain: sensor.domain, message: `branch is ${behind} commit(s) behind upstream`, key: "behind" });
  return { status: signals.length ? "SIGNAL" : "PASS", signals, detail: `${branch}; ${status.length} uncommitted path(s)` };
}

async function checkSensor(sensor) {
  const result = await runCheck(sensor.check, { context: `sensor:${sensor.id}` });
  if (result.status === "FAIL") return { status: "SIGNAL", signals: [{ severity: sensor.severity, domain: sensor.domain, message: `${sensor.title}: ${String(result.detail).split("\n")[0]}`, detail: result.detail, key: "check" }] };
  return { status: result.status, signals: [], detail: result.detail };
}

function envPresenceSensor(sensor) {
  // Reports only variable names, never values.
  const signals = sensor.required.filter(([name]) => !process.env[name]?.trim()).map(([name, severity]) => ({ severity, domain: sensor.domain, message: `credential/config ${name} not set in this environment`, key: name }));
  return { status: signals.length ? "SIGNAL" : "PASS", signals };
}

const KINDS = { sql: sqlSensor, "env-contract": envContractSensor, "env-presence": envPresenceSensor, git: gitSensor, check: checkSensor };

function emitFinding(sensor, signal) {
  const fingerprint = sha256(`${sensor.id}|${signal.key}|${signal.message.replace(/\(\d+ row\(s\)\)/, "")}`).slice(0, 24);
  if (loadFindings().some((f) => f.signal === fingerprint)) return null;
  const pending = `unknown — DISCOVERED by sensor ${sensor.id}; establish during triage`;
  const finding = {
    id: nextId(FINDINGS_DIR, "F"), title: signal.message.slice(0, 160), severity: signal.severity, domain: signal.domain, status: "DISCOVERED", confidence: "medium",
    evidence: [`sensor ${sensor.id} at ${nowIso()}: ${signal.message}`], rootCause: pending, producer: [pending], consumers: [pending], affectedFlow: sensor.feeds, invariantViolated: sensor.invariant,
    blastRadius: pending, dependencies: [], autofix: { eligible: false, reason: "not triaged" }, risk: "medium", correction: pending, requiredTests: ["to be defined at triage"], regressionRisk: pending,
    impactLevel: "L2", producerAgent: `sensor:${sensor.id}`, discoveredAt: nowIso(), signal: fingerprint,
    history: [{ status: "DISCOVERED", at: nowIso(), by: `sensor:${sensor.id}`, note: signal.message }],
  };
  saveFinding(finding);
  return finding.id;
}

run(async () => {
  const a = args();
  const only = a.only ? String(a.only).split(",") : null;
  const files = fs.readdirSync(osPath("sensors")).filter((n) => n.endsWith(".json")).sort();
  const report = [];
  for (const file of files) {
    const sensor = readJson(osPath("sensors", file));
    if (only && !only.includes(sensor.id)) continue;
    const result = await KINDS[sensor.kind](sensor);
    const created = a["emit-findings"] ? result.signals.map((signal) => emitFinding(sensor, signal)).filter(Boolean) : [];
    report.push({ sensor: sensor.id, status: result.status, signals: result.signals.map((s) => `${s.severity} ${s.message}`), detail: result.detail, createdFindings: created });
    console.log(`[${result.status}] ${sensor.id}${result.detail ? ` — ${String(result.detail).split("\n")[0]}` : ""}`);
    for (const s of result.signals) console.log(`    ${s.severity} ${s.message}`);
    for (const id of created) console.log(`    -> ${id} DISCOVERED`);
  }
  if (a["emit-findings"]) writeIndex();
  fs.mkdirSync(osPath("state", ".run"), { recursive: true });
  writeYml(osPath("state", ".run", "sensors.yml"), "Last sensor run (volatile)", { at: nowIso(), report });
});
