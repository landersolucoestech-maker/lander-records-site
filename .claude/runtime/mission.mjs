#!/usr/bin/env node
// Mission state (kernel/mission-engine.md). state/mission.yml holds the current mission, its
// requirements, non-requirements and acceptance criteria; history keeps closed missions.
//   start --objective TEXT | requirement --text TEXT [--non] | criterion --requirement R-001 --text TEXT --verify "<command>" | abort --note TEXT
//   status | close [--note TEXT]   (verdict computed by lib/completion.mjs)
import fs from "node:fs";
import { args, run, OsError, osPath, readYml, writeYml, git, nowIso, splitCommand } from "./lib/io.mjs";
import { loadEvidence, isFresh } from "./lib/evidence.mjs";
import { isVerifyArgv } from "./lib/commands.mjs";

const FILE = osPath("state", "mission.yml");
const HEADER = "Mission state — written by .claude/runtime/mission.mjs (contract: contracts/mission.schema.json)";
const load = () => (fs.existsSync(FILE) ? readYml(FILE) : { current: null, history: [] });
const save = (state) => writeYml(FILE, HEADER, state);
const pad = (n, width = 3) => String(n).padStart(width, "0");

run(async () => {
  const a = args();
  const command = a._[0] || "status";
  const state = load();
  const current = state.current;
  if (command === "start") {
    if (current && current.status === "ACTIVE") throw new OsError("MISSION_ACTIVE", `mission ${current.id} is still ACTIVE; close it first`);
    if (!a.objective) throw new OsError("USAGE", "--objective is required");
    const id = `M-${nowIso().slice(0, 10).replaceAll("-", "")}-${pad((state.history?.length || 0) + 1)}`;
    state.current = { id, objective: a.objective, status: "ACTIVE", startedAt: nowIso(), baseCommit: git(["rev-parse", "HEAD"]), branch: git(["rev-parse", "--abbrev-ref", "HEAD"]), verdict: "PENDING", findings: [], requirements: [] };
    save(state);
    console.log(`started ${id}`);
    return;
  }
  if (!current) throw new OsError("NO_MISSION", "no current mission; run: mission.mjs start --objective ...");
  if (command === "requirement") {
    if (!a.text) throw new OsError("USAGE", "--text is required");
    const id = `R-${pad(current.requirements.length + 1)}`;
    current.requirements.push({ id, text: a.text, nonRequirement: Boolean(a.non), criteria: [] });
    save(state);
    console.log(id);
    return;
  }
  if (command === "criterion") {
    // Each criterion declares the exact command that verifies it; only that command can close it.
    const requirement = current.requirements.find((r) => r.id === a.requirement);
    if (!requirement) throw new OsError("USAGE", "--requirement must name an existing requirement");
    if (!a.text || !a.verify) throw new OsError("USAGE", "--text and --verify \"<command>\" are required");
    if (!isVerifyArgv(splitCommand(a.verify))) throw new OsError("NOT_A_VERIFY_COMMAND", "--verify must be an allow-listed test/probe/audit or npm typecheck|build|lint|os:validate command (lib/commands.mjs)");
    const total = current.requirements.reduce((n, r) => n + r.criteria.length, 0);
    const id = `C-${pad(total + 1)}`;
    requirement.criteria.push({ id, text: a.text, verify: a.verify });
    save(state);
    console.log(id);
    return;
  }
  if (command === "abort") {
    if (!a.note) throw new OsError("USAGE", "--note is required");
    current.status = "ABORTED"; current.verdict = "D"; current.closedAt = nowIso(); current.note = a.note;
    state.history = [...(state.history || []), current]; state.current = null; save(state);
    console.log(`aborted ${current.id}`);
    return;
  }
  if (command === "status") {
    const evidence = loadEvidence();
    const criteria = current.requirements.filter((r) => !r.nonRequirement).flatMap((r) => r.criteria.map((c) => {
      const linked = evidence.filter((e) => e.kind !== "review" && e.mission === current.id && (e.criteria || []).includes(c.id));
      const fresh = linked.filter((e) => e.result === "PASS" && isFresh(e));
      return { requirement: r.id, criterion: c.id, text: c.text, evidence: linked.map((e) => `${e.id}:${e.result}`), closed: fresh.length > 0 };
    }));
    console.log(JSON.stringify({ id: current.id, status: current.status, objective: current.objective, criteria, open: criteria.filter((c) => !c.closed).map((c) => c.criterion) }, null, 2));
    return;
  }
  if (command === "close") {
    // The verdict is computed by the completion engine; a caller can never assert it.
    if (a.verdict) throw new OsError("POLICY_BLOCKED", "--verdict is not accepted; the verdict comes from the completion engine");
    const { evaluateCompletion } = await import("./lib/completion.mjs");
    const result = await evaluateCompletion();
    if (result.verdict === "D") throw new OsError("COMPLETION_FAILED", "completion conditions not met (run completion.mjs)", { failed: result.conditions.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail}`) });
    current.status = "COMPLETED";
    current.verdict = result.verdict;
    current.closedAt = nowIso();
    current.note = a.note || result.label;
    state.history = [...(state.history || []), current];
    state.current = null;
    save(state);
    console.log(`closed ${current.id} verdict ${result.verdict} — ${result.label}`);
    return;
  }
  throw new OsError("USAGE", "usage: mission.mjs start|requirement|criterion|status|close");
});
