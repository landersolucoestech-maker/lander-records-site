#!/usr/bin/env node
// Finding lifecycle CLI: list | ready | create --file F | show ID | transition ID --to STATE --note TEXT [--by AGENT] [--evidence EV-0001] | index | validate
import fs from "node:fs";
import { args, run, OsError, nextId, nowIso } from "./lib/io.mjs";
import { FINDINGS_DIR, loadFindings, priorityScore, saveFinding, transition, validateFinding, writeIndex, readyQueue } from "./lib/findings.mjs";

run(() => {
  const a = args();
  const command = a._[0] || "list";
  const all = loadFindings();
  if (command === "list") {
    const rows = all.filter((f) => !a.status || f.status === a.status).filter((f) => !a.domain || f.domain === a.domain);
    for (const f of rows) console.log(`${f.id}  ${f.severity}  ${f.status.padEnd(22)} ${String(priorityScore(f)).padStart(4)}  [${f.domain}] ${f.title}`);
    if (!rows.length) console.log("(no findings match)");
    return;
  }
  if (command === "ready") { for (const f of readyQueue(all)) console.log(`${f.id}  ${f.severity}  ${priorityScore(f)}  ${f.title}`); return; }
  if (command === "show") { const f = all.find((item) => item.id === a._[1]); if (!f) throw new OsError("NOT_FOUND", `unknown finding ${a._[1]}`); console.log(JSON.stringify(f, null, 2)); return; }
  if (command === "validate") {
    const errors = all.flatMap(validateFinding);
    if (errors.length) throw new OsError("INVALID_FINDING", `${errors.length} contract violation(s)`, { errors });
    console.log(`FINDINGS_VALID=${all.length}`);
    return;
  }
  if (command === "create") {
    // create --file draft.json : assigns the next id, stamps discovery, validates the contract.
    if (!a.file) throw new OsError("USAGE", "create --file <draft.json> (see templates/finding.json)");
    const draft = JSON.parse(fs.readFileSync(a.file, "utf8"));
    const at = nowIso();
    const finding = { ...draft, id: nextId(FINDINGS_DIR, "F"), discoveredAt: at, history: [{ status: draft.status, at, by: draft.producerAgent, note: draft.createNote || "created" }] };
    delete finding.createNote;
    saveFinding(finding);
    writeIndex();
    console.log(finding.id);
    return;
  }
  if (command === "index") { writeIndex(); console.log("state/findings.yml regenerated"); return; }
  if (command === "transition") {
    const f = all.find((item) => item.id === a._[1]);
    if (!f) throw new OsError("NOT_FOUND", `unknown finding ${a._[1]}`);
    const extra = {};
    if (a.evidence) extra.evidenceRecords = [...new Set([...(f.evidenceRecords || []), ...String(a.evidence).split(",")])];
    if (a.decision) extra.decision = a.decision;
    if (a.commit) extra.commits = [...new Set([...(f.commits || []), ...String(a.commit).split(",")])];
    const next = transition(f, a.to, a.by || "operator", a.note, extra);
    saveFinding(next);
    writeIndex();
    console.log(`${next.id}: ${f.status} -> ${next.status}`);
    return;
  }
  throw new OsError("USAGE", "usage: findings.mjs list|ready|show|validate|index|create|transition");
});
