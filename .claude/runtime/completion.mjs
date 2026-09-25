#!/usr/bin/env node
// Completion gate (kernel/completion-engine.md). Computes the mission verdict:
//   A — mission complete and state validated        B — partial; only proven external blockers remain
//   C — blocked by product decision                  D — regression or unsafe state
// Exit 0 only for A/B/C with all mandatory conditions satisfied.
import fs from "node:fs";
import { run, osPath, readYml, workspaceFingerprint, git } from "./lib/io.mjs";
import { loadFindings, OPEN_STATES, validateFinding } from "./lib/findings.mjs";
import { loadEvidence, isFresh } from "./lib/evidence.mjs";
import { validatePack } from "./lib/pack.mjs";

run(() => {
  const ws = workspaceFingerprint();
  const findings = loadFindings();
  const evidence = loadEvidence();
  const conditions = [];
  const add = (name, ok, detail) => conditions.push({ name, ok, detail });

  const missionFile = osPath("state", "mission.yml");
  const mission = fs.existsSync(missionFile) ? readYml(missionFile).current : null;
  add("mission exists", Boolean(mission), mission ? mission.id : "no current mission (mission.mjs start)");
  if (mission) {
    const criteria = mission.requirements.filter((r) => !r.nonRequirement).flatMap((r) => r.criteria);
    const open = criteria.filter((c) => !evidence.some((e) => (e.criteria || []).includes(c.id) && e.result === "PASS" && isFresh(e, ws)));
    add("every requirement has criteria", mission.requirements.filter((r) => !r.nonRequirement).every((r) => r.criteria.length), "requirements without acceptance criteria block completion");
    add("every criterion closed by fresh PASS evidence", open.length === 0, open.length ? `open: ${open.map((c) => c.id).join(", ")}` : `${criteria.length} closed`);
  }
  const invalid = findings.flatMap(validateFinding);
  add("findings satisfy contract", invalid.length === 0, invalid.slice(0, 5).join("; "));
  const ready = findings.filter((f) => f.status === "READY");
  add("no READY findings remain", ready.length === 0, ready.map((f) => f.id).join(", "));
  const inFlight = findings.filter((f) => OPEN_STATES.includes(f.status) && f.status !== "READY");
  add("no in-flight findings (DISCOVERED..REAUDITING)", inFlight.length === 0, inFlight.map((f) => `${f.id}:${f.status}`).join(", "));
  const unproven = findings.filter((f) => f.status === "RESOLVED" && !(f.evidenceRecords || []).some((id) => evidence.find((e) => e.id === id && e.result === "PASS")));
  add("RESOLVED findings carry PASS evidence", unproven.length === 0, unproven.map((f) => f.id).join(", "));
  const reviews = evidence.filter((e) => e.kind === "review");
  add("adversarial review recorded, none failing", reviews.length > 0 && !reviews.some((e) => e.result === "FAIL" && isFresh(e, ws)), reviews.map((e) => `${e.id}:${e.result}`).join(", ") || "no review evidence");
  const pack = validatePack();
  add("pack integrity", pack.errors.length === 0, pack.errors.slice(0, 5).join("; "));
  const dirty = git(["status", "--porcelain"], { allowFail: true }).split("\n").filter(Boolean).filter((l) => !l.slice(3).startsWith(".claude/state/.run"));
  add("changes committed", dirty.length === 0, dirty.slice(0, 10).join(", "));

  const failed = conditions.filter((c) => !c.ok);
  const needsDecision = findings.some((f) => f.status === "NEEDS_PRODUCT_DECISION");
  const external = findings.some((f) => f.status === "BLOCKED_EXTERNAL");
  const verdict = failed.length ? "D" : needsDecision ? "C" : external ? "B" : "A";
  for (const c of conditions) console.log(`[${c.ok ? "PASS" : "FAIL"}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  console.log(`VERDICT ${verdict} — ${{ A: "MISSÃO CONCLUÍDA E ESTADO VALIDADO", B: "CONSOLIDAÇÃO PARCIAL; RESTAM BLOQUEIOS EXTERNOS PROVADOS", C: "BLOQUEADO POR DECISÃO DE PRODUTO", D: "REGRESSÃO OU ESTADO INSEGURO" }[verdict]}`);
  process.exitCode = failed.length ? 1 : 0;
});
