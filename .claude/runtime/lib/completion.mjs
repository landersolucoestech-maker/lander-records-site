// Completion engine (kernel/completion-engine.md). The only producer of a mission verdict.
import fs from "node:fs";
import { osPath, readYml, git, workspaceFingerprint } from "./io.mjs";
import { loadFindings, OPEN_STATES, PARKED_STATES, validateFinding } from "./findings.mjs";
import { loadEvidence, isFresh, provesFinding, verifyChain } from "./evidence.mjs";
import { validatePack } from "./pack.mjs";

export const VERDICT_LABELS = {
  A: "MISSÃO CONCLUÍDA E ESTADO VALIDADO",
  B: "CONSOLIDAÇÃO PARCIAL; RESTAM BLOQUEIOS EXTERNOS PROVADOS",
  C: "BLOQUEADO POR DECISÃO DE PRODUTO",
  D: "REGRESSÃO OU ESTADO INSEGURO / CONDIÇÕES DE CONCLUSÃO NÃO ATENDIDAS",
};
const L5_REVIEWER = "security-reviewer";
const ALWAYS_REVIEWER = "adversarial-reviewer";
const REQUIRED_GATE = "regression";

export function evaluateCompletion() {
  const ws = workspaceFingerprint();
  const findings = loadFindings();
  const evidence = loadEvidence();
  const conditions = [];
  const add = (name, ok, detail = "") => conditions.push({ name, ok, detail });

  const missionFile = osPath("state", "mission.yml");
  const mission = fs.existsSync(missionFile) ? readYml(missionFile).current : null;
  add("active mission exists", Boolean(mission && mission.status === "ACTIVE"), mission ? `${mission.id} ${mission.status}` : "none");
  const requirements = (mission?.requirements || []).filter((r) => !r.nonRequirement);
  add("mission has requirements", requirements.length > 0, `${requirements.length} requirement(s)`);
  add("every requirement has criteria", requirements.length > 0 && requirements.every((r) => r.criteria.length > 0));
  const criteria = requirements.flatMap((r) => r.criteria);
  const openCriteria = criteria.filter((c) => !evidence.some((e) => (e.criteria || []).includes(c.id) && e.result === "PASS" && e.kind !== "review" && isFresh(e, ws)));
  add("every criterion closed by fresh executed PASS evidence", criteria.length > 0 && openCriteria.length === 0, openCriteria.length ? `open: ${openCriteria.map((c) => c.id).join(", ")}` : `${criteria.length} closed`);

  const invalid = findings.flatMap((f) => validateFinding(f, evidence));
  add("findings satisfy contract and lifecycle", invalid.length === 0, invalid.slice(0, 5).join("; "));
  add("evidence chain intact", verifyChain(evidence).length === 0, verifyChain(evidence).slice(0, 3).join("; "));
  const ready = findings.filter((f) => f.status === "READY");
  add("no READY findings remain", ready.length === 0, ready.map((f) => f.id).join(", "));
  const inFlight = findings.filter((f) => OPEN_STATES.includes(f.status) && f.status !== "READY");
  add("no in-flight findings", inFlight.length === 0, inFlight.map((f) => `${f.id}:${f.status}`).join(", "));
  const missionFindings = findings.filter((f) => (mission?.findings || []).includes(f.id) && f.status === "RESOLVED");
  const unproven = missionFindings.filter((f) => !(f.evidenceRecords || []).some((id) => { const e = evidence.find((r) => r.id === id); return e && provesFinding(e, f.id, ws); }));
  add("findings resolved in this mission have fresh proof", unproven.length === 0, unproven.map((f) => f.id).join(", "));

  const needsSecurity = findings.some((f) => (mission?.findings || []).includes(f.id) && f.impactLevel === "L5");
  const requiredReviewers = [ALWAYS_REVIEWER, ...(needsSecurity ? [L5_REVIEWER] : [])];
  for (const reviewer of requiredReviewers) {
    const latest = evidence.filter((e) => e.kind === "review" && e.producer === reviewer && isFresh(e, ws)).at(-1);
    add(`fresh ${reviewer} review is PASS`, latest?.result === "PASS", latest ? `${latest.id}:${latest.result}` : "no fresh review for the current workspace");
  }
  const failingReviews = evidence.filter((e) => e.kind === "review" && e.result === "FAIL" && isFresh(e, ws) && !evidence.some((later) => later.kind === "review" && later.producer === e.producer && later.id > e.id && later.result === "PASS" && isFresh(later, ws)));
  add("no unanswered fresh FAIL review", failingReviews.length === 0, failingReviews.map((e) => `${e.id}:${e.producer}`).join(", "));

  const historyFile = osPath("state", "validation-history.yml");
  const gateRuns = fs.existsSync(historyFile) ? readYml(historyFile).entries : [];
  const gateRun = gateRuns.filter((g) => g.gate === REQUIRED_GATE && g.fingerprint === ws.fingerprint).at(-1);
  add(`fresh ${REQUIRED_GATE} gate PASS`, gateRun?.verdict === "PASS", gateRun ? `${gateRun.verdict} at ${gateRun.at}` : "not run for the current workspace (gate.mjs regression --record)");

  const pack = validatePack();
  add("pack integrity", pack.errors.length === 0, pack.errors.slice(0, 5).join("; "));
  const dirty = git(["status", "--porcelain"], { allowFail: true }).split("\n").filter(Boolean).filter((l) => !l.slice(3).startsWith(".claude/state/.run"));
  add("changes committed", dirty.length === 0, dirty.slice(0, 10).join(", "));

  const failed = conditions.filter((c) => !c.ok);
  const parked = findings.filter((f) => PARKED_STATES.includes(f.status));
  const verdict = failed.length ? "D" : parked.some((f) => f.status === "NEEDS_PRODUCT_DECISION") ? "C" : parked.some((f) => f.status === "BLOCKED_EXTERNAL") ? "B" : "A";
  return { verdict, label: VERDICT_LABELS[verdict], conditions, workspace: ws };
}
