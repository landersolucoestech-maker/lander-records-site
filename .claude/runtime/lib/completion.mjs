// Completion engine (kernel/completion-engine.md) — the only producer of a mission verdict.
// Trust model (ADR-0007): recorded PASS is never trusted on its own. Completion RE-EXECUTES every criterion's
// declared verify command, the proof command of every finding resolved in the mission, and the regression gate,
// against the current workspace. Records are an audit trail; git is their anchor (pack.mjs gitAnchorErrors).
import fs from "node:fs";
import path from "node:path";
import { osPath, readJson, git, workspaceFingerprint, splitCommand, RECORD_PATHS, GENERATED_PATHS, REPO_ROOT } from "./io.mjs";
import { porcelainPath } from "./io.mjs";
import { loadFindings, missingRequiredTests, requiredTestTokens, runsRequiredTest, OPEN_STATES, PARKED_STATES, validateFinding } from "./findings.mjs";
import { loadEvidence, provesFinding, verifyChain, runCommandEvidence } from "./evidence.mjs";
import { validatePack } from "./pack.mjs";
import { isVerifyArgv } from "./commands.mjs";
import { currentMission, missionAnchorErrors, missionFindingIds, missionHash } from "./mission-def.mjs";
import { runCheck } from "./checks.mjs";

export const VERDICT_LABELS = {
  A: "MISSÃO CONCLUÍDA E ESTADO VALIDADO",
  B: "CONSOLIDAÇÃO PARCIAL; RESTAM BLOQUEIOS EXTERNOS PROVADOS",
  C: "BLOQUEADO POR DECISÃO DE PRODUTO",
  D: "REGRESSÃO OU ESTADO INSEGURO / CONDIÇÕES DE CONCLUSÃO NÃO ATENDIDAS",
};
const ALWAYS_REVIEWER = "adversarial-reviewer";
const L5_REVIEWER = "security-reviewer";

export async function evaluateCompletion({ execute = true } = {}) {
  const conditions = [];
  const add = (name, ok, detail = "") => conditions.push({ name, ok, detail });
  const attempt = (fn) => { try { return fn(); } catch (error) { return { result: "FAIL", id: "-", error: `${error.code || "ERROR"}: ${error.message}` }; } };
  const findings = loadFindings();
  const evidence = loadEvidence();
  const mission = currentMission();
  add("active mission exists", mission?.status === "ACTIVE", mission ? `${mission.id} ${mission.status}` : "none");
  const requirements = (mission?.requirements || []).filter((r) => !r.nonRequirement);
  const criteria = requirements.flatMap((r) => r.criteria);
  add("requirements each have criteria with allow-listed verify commands", requirements.length > 0 && requirements.every((r) => r.criteria.length) && criteria.every((c) => c.verify && isVerifyArgv(splitCommand(c.verify))), `${requirements.length} requirement(s), ${criteria.length} criteria`);
  // Criteria that exercise a running server (browser specs, HTTP probes) must see a build at least as new as the
  // committed product code. Limit: mtime and commit time are both writer-controlled, and this does not prove the
  // running process serves this build (ADR-0007 Consequences).
  if (criteria.some((c) => /PLAYWRIGHT_BASE_URL=|OS_BASE_URL=|\bplaywright\s+test\b|test:browser|\.claude\/runtime\/probes\//.test(c.verify || ""))) {
    const buildId = path.join(REPO_ROOT, ".next", "BUILD_ID");
    const lastProductCommit = Number(git(["log", "-1", "--format=%ct", "--", "app", "lib", "modules", "styles", "public", "assets", "migrations", "next.config.mjs", "tsconfig.json", "package.json", "package-lock.json", "proxy.ts"], { allowFail: true }) || 0) * 1000;
    const built = fs.existsSync(buildId) ? fs.statSync(buildId).mtimeMs : 0;
    add("server-backed criteria: production build newer than the last product commit", built >= lastProductCommit, built ? `build ${new Date(built).toISOString()} vs product commit ${new Date(lastProductCommit).toISOString()} (the running server must be restarted from this build)` : "no .next/BUILD_ID");
  }
  const anchorErrors = missionAnchorErrors(mission);
  add("mission definition anchored (committed; only additions since first commit; startedAt consistent)", anchorErrors.length === 0, anchorErrors.slice(0, 4).join("; "));

  // Structural integrity first (cheap).
  const invalid = findings.flatMap((f) => validateFinding(f, evidence));
  add("findings satisfy contract and replayed lifecycle", invalid.length === 0, invalid.slice(0, 5).join("; "));
  const chain = verifyChain(evidence);
  add("evidence chain intact", chain.length === 0, chain.slice(0, 3).join("; "));
  const pack = validatePack();
  add("pack integrity (incl. git anchoring of records)", pack.errors.length === 0, pack.errors.slice(0, 5).join("; "));
  const ready = findings.filter((f) => f.status === "READY");
  add("no READY findings remain", ready.length === 0, ready.map((f) => f.id).join(", "));
  const inFlight = findings.filter((f) => OPEN_STATES.includes(f.status) && f.status !== "READY");
  add("no in-flight findings", inFlight.length === 0, inFlight.map((f) => `${f.id}:${f.status}`).join(", "));
  const dirty = git(["status", "--porcelain"], { allowFail: true }).split("\n").filter(Boolean).map(porcelainPath).filter((file) => ![...RECORD_PATHS, ...GENERATED_PATHS].some((p) => file.startsWith(p)));
  add("product and OS code committed", dirty.length === 0, dirty.slice(0, 10).join(", "));

  // Reviews: the latest record per role must not be FAIL (regardless of freshness); required roles need a
  // PASS whose dispatch ticket fingerprint equals the current workspace.
  const ws = workspaceFingerprint();
  const reviews = evidence.filter((e) => e.kind === "review");
  const roles = [...new Set(reviews.map((e) => e.producer))];
  const failing = roles.filter((role) => reviews.filter((e) => e.producer === role).at(-1)?.result === "FAIL");
  add("no role's latest review is FAIL", failing.length === 0, failing.join(", "));
  // Mission scope comes from git-anchored findings history (lib/mission-def.mjs missionFindingIds), not from an
  // editable list; abort + restart cannot shrink it.
  const scope = missionFindingIds(mission, findings);
  const missionFindings = findings.filter((f) => scope.has(f.id));
  const required = [ALWAYS_REVIEWER, ...(missionFindings.some((f) => f.impactLevel === "L5") ? [L5_REVIEWER] : [])];
  for (const role of required) {
    const latest = reviews.filter((e) => e.producer === role).at(-1);
    add(`${role} PASS for the current workspace and mission definition (ticketed)`, Boolean(latest && latest.result === "PASS" && latest.ticket && latest.fingerprint === ws.fingerprint && latest.missionHash === missionHash(mission)), latest ? `${latest.id}:${latest.result}` : "none");
  }

  // Re-execution.
  if (!execute) {
    add("re-execution of criteria, finding proofs and regression gate", false, "skipped (--no-exec): verdict cannot be better than D");
  } else if (conditions.every((c) => c.ok)) {
    for (const r of reexecuteCriteria(criteria)) add(`criterion ${r.id} re-executed`, r.ok, r.detail);
    const proofs = new Map();
    for (const f of missionFindings.filter((x) => x.status === "RESOLVED")) {
      // Every named suite is re-run: for each, the latest proof of this finding that runs it.
      const records = (f.evidenceRecords || []).map((id) => evidence.find((e) => e.id === id)).filter((e) => e && provesFinding(e, f.id));
      const tokens = requiredTestTokens(f);
      const missing = missingRequiredTests(f, records);
      if (missing.length) { add(`finding ${f.id} has proofs that run every requiredTests suite`, false, `missing: ${missing.join(", ")}`); continue; }
      for (const token of tokens) {
        const proof = records.filter((e) => runsRequiredTest(token, e)).at(-1);
        const argv = proof.argv || splitCommand(proof.command);
        const key = JSON.stringify(argv);
        if (!proofs.has(key)) proofs.set(key, { argv, findings: [] });
        if (!proofs.get(key).findings.includes(f.id)) proofs.get(key).findings.push(f.id);
      }
    }
    for (const { argv, findings: ids } of proofs.values()) {
      const ev = attempt(() => runCommandEvidence({ argv, findings: ids, kind: "test", summary: `completion re-run proof for ${ids.join(",")}`, producer: "completion" }));
      add(`proof re-executed for ${ids.join(", ")}`, ev.result === "PASS", `${ev.id} ${ev.result}: ${argv.join(" ")}${ev.error ? ` (${ev.error})` : ""}`);
    }
    const gate = readJson(osPath("gates", "regression.json"));
    for (const check of gate.checks) {
      const result = await runCheck(check, { record: true, context: "completion:regression" }).catch((error) => ({ status: "FAIL", detail: `${error.code || "ERROR"}: ${error.message}` }));
      add(`regression gate: ${check.name}`, result.status === "PASS", `${result.status} ${result.detail?.split("\n")[0] ?? ""}`);
    }
  } else {
    add("re-execution of criteria, finding proofs and regression gate", false, "skipped: structural conditions failed");
  }

  const failed = conditions.filter((c) => !c.ok);
  const parked = findings.filter((f) => PARKED_STATES.includes(f.status));
  const verdict = failed.length ? "D" : parked.some((f) => f.status === "NEEDS_PRODUCT_DECISION") ? "C" : parked.some((f) => f.status === "BLOCKED_EXTERNAL") ? "B" : "A";
  return { verdict, label: VERDICT_LABELS[verdict], conditions };
}

/** Re-runs each criterion's declared command now; recorded evidence is ignored (a forged PASS cannot help). */
export function reexecuteCriteria(criteria) {
  return criteria.map((c) => {
    let ev;
    try { ev = runCommandEvidence({ argv: splitCommand(c.verify), criteria: [c.id], kind: "command", summary: `completion re-run ${c.id}`, producer: "completion" }); } catch (error) { ev = { id: "-", result: "FAIL", error: `${error.code || "ERROR"}: ${error.message}` }; }
    return { id: c.id, ok: ev.result === "PASS", detail: `${ev.id} ${ev.result}: ${c.verify}${ev.error ? ` (${ev.error})` : ""}` };
  });
}
