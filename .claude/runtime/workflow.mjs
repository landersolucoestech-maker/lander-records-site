#!/usr/bin/env node
// workflow.mjs list | show <id> | run <id> --phase <phase> [--record] [--finding F-NNNN]
// run: prints the phase's agents (with dispatch commands) and skills, then executes the phase's gates.
import { spawnSync } from "node:child_process";
import { args, run, OsError, osPath, readYml, readJson } from "./lib/io.mjs";

run(() => {
  const a = args();
  const [command = "list", id] = a._;
  const registry = readJson(osPath("control-plane", "registry.json"));
  if (command === "list") { for (const w of registry.components.workflows) console.log(`${w.id.padEnd(26)} ${readYml(osPath(w.path)).title}`); return; }
  const entry = registry.components.workflows.find((w) => w.id === id);
  if (!entry) throw new OsError("NOT_FOUND", `unknown workflow ${id}`);
  const wf = readYml(osPath(entry.path));
  if (command === "show") { console.log(JSON.stringify(wf, null, 2)); return; }
  if (command === "run") {
    const phase = wf.phases.find((p) => p.id === a.phase);
    if (!phase) throw new OsError("USAGE", `--phase must be one of: ${wf.phases.map((p) => p.id).join(", ")}`);
    console.log(`# ${wf.id} / ${phase.id} — expected transition: ${phase.transition}`);
    for (const agent of phase.agents) console.log(`agent: ${agent}  →  node .claude/runtime/dispatch.mjs ${agent}${a.finding ? ` --finding ${a.finding}` : ""}`);
    for (const skill of phase.skills) console.log(`skill: /${skill}  (.claude/skills/${skill}/SKILL.md)`);
    let verdict = "PASS";
    for (const gate of phase.gates) {
      const result = spawnSync(process.execPath, [osPath("runtime", "gate.mjs"), gate, ...(a.record ? ["--record"] : [])], { stdio: "inherit" });
      if (result.status === 1) verdict = "FAIL";
      else if (result.status !== 0 && verdict === "PASS") verdict = "BLOCKED";
    }
    console.log(`PHASE ${wf.id}/${phase.id} gates = ${phase.gates.length ? verdict : "NONE"}; stop conditions: ${wf.stopConditions.join("; ")}`);
    process.exitCode = verdict === "FAIL" ? 1 : verdict === "BLOCKED" ? 77 : 0;
    return;
  }
  throw new OsError("USAGE", "workflow.mjs list|show|run");
});
