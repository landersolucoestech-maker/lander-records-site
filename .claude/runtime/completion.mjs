#!/usr/bin/env node
// Completion gate: completion.mjs [--no-exec]. Re-executes proofs by default (see lib/completion.mjs).
import { args, run } from "./lib/io.mjs";
import { evaluateCompletion } from "./lib/completion.mjs";

run(async () => {
  const a = args();
  const { verdict, label, conditions } = await evaluateCompletion({ execute: !a["no-exec"] });
  for (const c of conditions) console.log(`[${c.ok ? "PASS" : "FAIL"}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  console.log(`VERDICT ${verdict} — ${label}`);
  process.exitCode = verdict === "D" ? 1 : 0;
});
