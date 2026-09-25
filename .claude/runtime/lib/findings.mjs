import fs from "node:fs";
import path from "node:path";
import { OsError, osPath, readJson, writeJson, writeYml, nowIso } from "./io.mjs";
import { validate } from "./schema.mjs";

export const FINDINGS_DIR = osPath("findings");
export const OPEN_STATES = ["DISCOVERED", "TRIAGED", "READY", "INVESTIGATING", "ROOT_CAUSE_CONFIRMED", "FIXING", "VALIDATING", "REAUDITING"];
export const PARKED_STATES = ["BLOCKED_EXTERNAL", "NEEDS_PRODUCT_DECISION"];
export const CLOSED_STATES = ["RESOLVED", "DUPLICATED", "OBSOLETE", "FALSE_POSITIVE"];

// kernel/state-machine.md is the prose form of this table; tests assert they agree.
export const TRANSITIONS = {
  DISCOVERED: ["TRIAGED", "DUPLICATED", "FALSE_POSITIVE", "OBSOLETE"],
  TRIAGED: ["READY", "NEEDS_PRODUCT_DECISION", "BLOCKED_EXTERNAL", "DUPLICATED", "FALSE_POSITIVE", "OBSOLETE"],
  READY: ["INVESTIGATING", "NEEDS_PRODUCT_DECISION", "BLOCKED_EXTERNAL", "DUPLICATED"],
  INVESTIGATING: ["ROOT_CAUSE_CONFIRMED", "FALSE_POSITIVE", "NEEDS_PRODUCT_DECISION", "BLOCKED_EXTERNAL"],
  ROOT_CAUSE_CONFIRMED: ["FIXING", "NEEDS_PRODUCT_DECISION", "BLOCKED_EXTERNAL"],
  FIXING: ["VALIDATING", "INVESTIGATING"],
  VALIDATING: ["REAUDITING", "FIXING"],
  REAUDITING: ["RESOLVED", "FIXING"],
  NEEDS_PRODUCT_DECISION: ["READY", "OBSOLETE"],
  BLOCKED_EXTERNAL: ["READY", "OBSOLETE"],
  RESOLVED: ["INVESTIGATING"],
  DUPLICATED: [],
  OBSOLETE: [],
  FALSE_POSITIVE: [],
};

const SEVERITY = { P0: 1000, P1: 500, P2: 200, P3: 50 };
const CONFIDENCE = { confirmed: 60, high: 40, medium: 20, low: 0 };
const RISK = { low: 0, medium: 20, high: 60 };
const DOMAIN_BONUS = { security: 150, leads: 120, identity: 100, database: 80, integrations: 60, seo: 40 };

export function schema() { return readJson(osPath("contracts", "finding.schema.json")); }

export function loadFindings() {
  if (!fs.existsSync(FINDINGS_DIR)) return [];
  return fs.readdirSync(FINDINGS_DIR).filter((name) => /^F-\d{4}\.json$/.test(name)).sort().map((name) => readJson(path.join(FINDINGS_DIR, name)));
}

export function validateFinding(finding) {
  const errors = validate(schema(), finding).map((message) => `${finding.id ?? "?"}: ${message}`);
  if (finding.history?.at(-1)?.status !== finding.status) errors.push(`${finding.id}: last history entry must equal current status`);
  if (finding.status === "RESOLVED" && !(finding.evidenceRecords?.length)) errors.push(`${finding.id}: RESOLVED requires evidenceRecords`);
  if (finding.status === "NEEDS_PRODUCT_DECISION" && !finding.decision) errors.push(`${finding.id}: NEEDS_PRODUCT_DECISION requires a decision record`);
  return errors;
}

/** Priority engine (kernel/priority-engine.md). Higher first; ties by id for determinism. */
export function priorityScore(finding) {
  return (SEVERITY[finding.severity] ?? 0) + (DOMAIN_BONUS[finding.domain] ?? 0) + (CONFIDENCE[finding.confidence] ?? 0) - (RISK[finding.risk] ?? 0);
}

export function isBlocked(finding, all) {
  return (finding.dependencies || []).some((dep) => {
    if (dep.startsWith("DEC-")) return true;
    const target = all.find((item) => item.id === dep);
    return !target || !CLOSED_STATES.includes(target.status);
  });
}

export function readyQueue(all = loadFindings()) {
  return all.filter((f) => f.status === "READY" && !isBlocked(f, all)).sort((a, b) => priorityScore(b) - priorityScore(a) || a.id.localeCompare(b.id));
}

export function transition(finding, to, by, note, extra = {}) {
  const allowed = TRANSITIONS[finding.status] || [];
  if (!allowed.includes(to)) throw new OsError("ILLEGAL_TRANSITION", `${finding.id}: ${finding.status} -> ${to} is not allowed`, { allowed });
  if (!note) throw new OsError("NOTE_REQUIRED", "every transition needs --note with the reason/evidence");
  const next = { ...finding, ...extra, status: to, history: [...finding.history, { status: to, at: nowIso(), by, note }] };
  const errors = validateFinding(next);
  if (errors.length) throw new OsError("INVALID_FINDING", "transition would produce an invalid finding", { errors });
  return next;
}

export function saveFinding(finding) {
  const errors = validateFinding(finding);
  if (errors.length) throw new OsError("INVALID_FINDING", "finding failed contract validation", { errors });
  writeJson(path.join(FINDINGS_DIR, `${finding.id}.json`), finding);
}

/** state/findings.yml is a derived index; pack.mjs fails when it is stale. */
export function buildIndex(all = loadFindings()) {
  const count = (states) => all.filter((f) => states.includes(f.status)).length;
  return {
    derivedFrom: ".claude/findings/*.json",
    totals: { all: all.length, open: count(OPEN_STATES), parked: count(PARKED_STATES), closed: count(CLOSED_STATES), ready: count(["READY"]) },
    readyQueue: readyQueue(all).map((f) => f.id),
    findings: all.map((f) => ({ id: f.id, title: f.title, severity: f.severity, domain: f.domain, status: f.status, priority: priorityScore(f), decision: f.decision ?? null, evidenceRecords: f.evidenceRecords ?? [] })),
  };
}
export function writeIndex() { writeYml(osPath("state", "findings.yml"), "Derived index of .claude/findings — regenerate with: node .claude/runtime/findings.mjs index", buildIndex()); }
