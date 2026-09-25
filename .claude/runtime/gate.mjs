#!/usr/bin/env node
// gate.mjs <gate-id> [--record]   Evaluates gates/<gate-id>.json. --record stores command results as evidence.
// gate.mjs list
import fs from "node:fs";
import { args, run, osPath, readJson, OsError, writeYml, readYml, nowIso, workspaceFingerprint } from "./lib/io.mjs";
import { runCheck } from "./lib/checks.mjs";

run(async () => {
  const a = args();
  const id = a._[0];
  if (!id || id === "list") { for (const f of fs.readdirSync(osPath("gates")).filter((n) => n.endsWith(".json"))) { const g = readJson(osPath("gates", f)); console.log(`${g.id.padEnd(22)} ${g.title}`); } return; }
  const file = osPath("gates", `${id}.json`);
  if (!fs.existsSync(file)) throw new OsError("NOT_FOUND", `unknown gate ${id}`);
  const gate = readJson(file);
  const before = workspaceFingerprint().fingerprint;
  const results = [];
  for (const check of gate.checks) results.push({ name: check.name, ...(await runCheck(check, { record: Boolean(a.record), context: `gate:${id}` })) });
  const verdict = results.some((r) => r.status === "FAIL") ? "FAIL" : results.some((r) => r.status === "BLOCKED") ? "BLOCKED" : "PASS";
  for (const r of results) console.log(`[${r.status}] ${r.name}${r.status !== "PASS" ? `\n    ${String(r.detail).split("\n").join("\n    ")}` : ""}`);
  console.log(`GATE ${id} = ${verdict}`);
  if (a.record) {
    const historyFile = osPath("state", "validation-history.yml");
    const history = fs.existsSync(historyFile) ? readYml(historyFile) : { entries: [] };
    const after = workspaceFingerprint().fingerprint;
    if (after !== before) throw new OsError("WORKSPACE_CHANGED", "workspace changed during the gate run; result not recorded");
    history.entries = [...history.entries, { gate: id, verdict, at: nowIso(), fingerprint: before, checks: results.map((r) => ({ name: r.name, status: r.status, evidence: r.evidence ?? null })) }].slice(-200);
    writeYml(historyFile, "Gate executions recorded with --record (latest 200)", history);
  }
  process.exitCode = verdict === "PASS" ? 0 : verdict === "BLOCKED" ? 77 : 1;
});
