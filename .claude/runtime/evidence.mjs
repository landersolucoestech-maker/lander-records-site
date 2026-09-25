#!/usr/bin/env node
// evidence.mjs run [--finding F-0001] [--criterion C-001] [--kind test] [--summary TEXT] -- <command> [args...]
// evidence.mjs review --reviewer NAME --verdict PASS|FAIL --summary TEXT --report FILE [--finding F-0001]
// evidence.mjs list | fresh
import { args, run, OsError, workspaceFingerprint } from "./lib/io.mjs";
import { runCommandEvidence, recordReview, loadEvidence, isFresh } from "./lib/evidence.mjs";

const split = (value) => (value ? String(value).split(",").filter(Boolean) : []);
run(() => {
  const a = args();
  const command = a._[0] || "list";
  if (a.result || a.pass) throw new OsError("POLICY_BLOCKED", "caller-asserted results are forbidden; evidence comes only from execution or a recorded review");
  if (command === "run") {
    const record = runCommandEvidence({ argv: a["--"], kind: a.kind || "command", findings: split(a.finding), criteria: split(a.criterion), summary: a.summary, producer: a.producer || "claude-code" });
    console.log(`${record.id} ${record.result} exit=${record.exitCode} ${record.command}`);
    if (record.result !== "PASS") process.exitCode = record.result === "BLOCKED" ? 77 : 1;
    return;
  }
  if (command === "review") {
    const record = recordReview({ reviewer: a.reviewer, verdict: a.verdict, summary: a.summary, findings: split(a.finding), criteria: split(a.criterion), reportFile: a.report });
    console.log(`${record.id} review ${record.result} by ${a.reviewer}`);
    return;
  }
  const ws = workspaceFingerprint();
  const records = loadEvidence().filter((r) => command !== "fresh" || isFresh(r, ws));
  for (const r of records) console.log(`${r.id} ${r.result.padEnd(8)} ${isFresh(r, ws) ? "fresh" : "stale"} ${r.kind.padEnd(8)} ${(r.findings || []).join(",")} ${r.summary}`);
});
