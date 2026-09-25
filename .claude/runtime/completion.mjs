#!/usr/bin/env node
// Completion gate (kernel/completion-engine.md). Prints every condition and the computed verdict.
import { run } from "./lib/io.mjs";
import { evaluateCompletion } from "./lib/completion.mjs";

run(() => {
  const { verdict, label, conditions } = evaluateCompletion();
  for (const c of conditions) console.log(`[${c.ok ? "PASS" : "FAIL"}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  console.log(`VERDICT ${verdict} — ${label}`);
  process.exitCode = verdict === "D" ? 1 : 0;
});
