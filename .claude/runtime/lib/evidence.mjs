import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OsError, osPath, readJson, writeJson, nextId, nowIso, sha256, workspaceFingerprint, REPO_ROOT } from "./io.mjs";
import { validate } from "./schema.mjs";

export const EVIDENCE_DIR = osPath("evidence");

export function loadEvidence() {
  if (!fs.existsSync(EVIDENCE_DIR)) return [];
  return fs.readdirSync(EVIDENCE_DIR).filter((n) => /^EV-\d{4}\.json$/.test(n)).sort().map((n) => readJson(path.join(EVIDENCE_DIR, n)));
}

function persist(record) {
  const errors = validate(readJson(osPath("contracts", "evidence.schema.json")), record);
  if (errors.length) throw new OsError("INVALID_EVIDENCE", "evidence record failed contract validation", { errors });
  writeJson(path.join(EVIDENCE_DIR, `${record.id}.json`), record);
  return record;
}

/** Executes a command (no shell) and records its real outcome. Callers can never assert PASS. */
export function runCommandEvidence({ argv, kind = "command", findings = [], criteria = [], summary, producer = "runtime", env = {}, timeoutMs = 600000 }) {
  if (!argv?.length) throw new OsError("USAGE", "a command is required after --");
  const before = workspaceFingerprint();
  const started = Date.now();
  const child = spawnSync(argv[0], argv.slice(1), { cwd: REPO_ROOT, env: { ...process.env, ...env }, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, shell: false });
  const output = `${child.stdout || ""}${child.stderr || ""}`;
  const blocked = child.error && ["ENOENT", "EACCES", "EPERM", "ETIMEDOUT"].includes(child.error.code);
  const result = blocked ? "BLOCKED" : child.status === 0 ? "PASS" : "FAIL";
  const record = {
    id: nextId(EVIDENCE_DIR, "EV"), kind, findings, criteria,
    summary: summary || `${argv.join(" ")} -> ${result}`,
    command: argv.join(" "), exitCode: typeof child.status === "number" ? child.status : -1, result,
    commit: before.head === "NO_HEAD" ? "0000000" : before.head, dirty: before.dirty, fingerprint: before.fingerprint,
    environment: `node ${process.version} ${process.platform}; duration ${Date.now() - started}ms${child.error ? `; error ${child.error.code}` : ""}`,
    outputSha256: sha256(output), excerpt: output.slice(-3500), recordedAt: nowIso(), producer,
  };
  return persist(record);
}

/** A completed independent review's verdict. The reviewer text must be attached as a file. */
export function recordReview({ reviewer, verdict, summary, findings = [], criteria = [], reportFile }) {
  if (!["PASS", "FAIL"].includes(verdict)) throw new OsError("USAGE", "--verdict must be PASS or FAIL");
  if (!reportFile || !fs.existsSync(reportFile)) throw new OsError("USAGE", "--report must point to the reviewer's full output");
  const report = fs.readFileSync(reportFile, "utf8");
  if (!new RegExp(`VERDICT:\\s*${verdict}`).test(report)) throw new OsError("VERDICT_MISMATCH", `report does not contain "VERDICT: ${verdict}"`);
  const ws = workspaceFingerprint();
  return persist({
    id: nextId(EVIDENCE_DIR, "EV"), kind: "review", findings, criteria, summary, result: verdict,
    commit: ws.head, dirty: ws.dirty, fingerprint: ws.fingerprint, environment: `review by ${reviewer}`,
    outputSha256: sha256(report), excerpt: report.slice(-3500), recordedAt: nowIso(), producer: reviewer,
  });
}

export function isFresh(record, ws = workspaceFingerprint()) {
  return record.fingerprint === ws.fingerprint;
}
