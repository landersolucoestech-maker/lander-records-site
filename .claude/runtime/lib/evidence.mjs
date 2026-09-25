import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OsError, osPath, readJson, readYml, createRecord, nowIso, sha256, workspaceFingerprint, REPO_ROOT } from "./io.mjs";
import { validate } from "./schema.mjs";

export const EVIDENCE_DIR = osPath("evidence");

export function loadEvidence({ except } = {}) {
  if (!fs.existsSync(EVIDENCE_DIR)) return [];
  return fs.readdirSync(EVIDENCE_DIR).filter((n) => /^EV-\d{4}\.json$/.test(n) && n !== `${except}.json` && fs.statSync(path.join(EVIDENCE_DIR, n)).size > 0).sort().map((n) => readJson(path.join(EVIDENCE_DIR, n)));
}

/** Tamper-evident chain: hash = sha256(prevHash + canonical record without hash). Hand-written or edited records break it. */
export function recordHash(record) {
  const { hash, ...body } = record;
  void hash;
  return sha256(`${record.prevHash}\n${JSON.stringify(body)}`);
}
export function verifyChain(records = loadEvidence()) {
  const errors = [];
  let prev = "GENESIS";
  for (const record of records) {
    if (record.prevHash !== prev) errors.push(`${record.id}: prevHash does not link to the previous record (chain broken or record inserted by hand)`);
    if (record.hash !== recordHash(record)) errors.push(`${record.id}: content does not match its hash (edited after recording)`);
    prev = record.hash;
  }
  return errors;
}
// The chain links to the highest id below the record being created (its placeholder file is still empty).
const chainHead = (id) => loadEvidence({ except: id }).filter((r) => r.id < id).at(-1)?.hash ?? "GENESIS";

function persist(build) {
  const schema = readJson(osPath("contracts", "evidence.schema.json"));
  return createRecord(EVIDENCE_DIR, "EV", (id) => {
    const record = { ...build(id), prevHash: chainHead(id) };
    record.hash = recordHash(record);
    const errors = validate(schema, record);
    if (errors.length) throw new OsError("INVALID_EVIDENCE", "evidence record failed contract validation", { errors });
    return record;
  });
}

/** Criteria must belong to the ACTIVE mission; findings must exist. Typos never create orphan evidence. */
function checkLinks(criteria, findings) {
  if (criteria.length) {
    const file = osPath("state", "mission.yml");
    const mission = fs.existsSync(file) ? readYml(file).current : null;
    const known = new Set((mission?.requirements || []).flatMap((r) => r.criteria.map((c) => c.id)));
    const unknown = criteria.filter((c) => !known.has(c));
    if (unknown.length) throw new OsError("UNKNOWN_CRITERION", `criteria not in the active mission: ${unknown.join(", ")}`);
  }
  const unknownFindings = findings.filter((f) => !fs.existsSync(osPath("findings", `${f}.json`)));
  if (unknownFindings.length) throw new OsError("UNKNOWN_FINDING", `unknown findings: ${unknownFindings.join(", ")}`);
}

function environment(extra = "") {
  let engines = "";
  try { engines = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")).engines?.node || ""; } catch { engines = ""; }
  const major = Number(process.versions.node.split(".")[0]);
  const range = engines.match(/>=\s*(\d+)\s*<\s*(\d+)/);
  const mismatch = range && (major < Number(range[1]) || major >= Number(range[2])) ? ` (outside engines ${engines})` : "";
  return `node ${process.version}${mismatch} ${process.platform}${extra}`;
}

/** Executes a command (no shell) and records its real outcome. Callers can never assert PASS. */
export function runCommandEvidence({ argv, kind = "command", findings = [], criteria = [], summary, producer = "runtime", env = {}, timeoutMs = 600000 }) {
  if (!argv?.length) throw new OsError("USAGE", "a command is required after --");
  checkLinks(criteria, findings);
  const before = workspaceFingerprint();
  const started = Date.now();
  const child = spawnSync(argv[0], argv.slice(1), { cwd: REPO_ROOT, env: { ...process.env, ...env }, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, shell: false });
  const output = `${child.stdout || ""}${child.stderr || ""}`;
  // Missing binary / permission = environment gap (BLOCKED). A timeout is the command failing (FAIL).
  const blocked = child.error && ["ENOENT", "EACCES", "EPERM"].includes(child.error.code);
  const result = blocked ? "BLOCKED" : child.status === 0 ? "PASS" : "FAIL";
  const after = workspaceFingerprint();
  if (after.fingerprint !== before.fingerprint) throw new OsError("WORKSPACE_CHANGED", "the workspace changed while the command ran; evidence would not describe a single state");
  return persist((id) => ({
    id, kind, findings, criteria,
    summary: summary || `${argv.join(" ")} -> ${result}`,
    command: argv.join(" "), exitCode: typeof child.status === "number" ? child.status : -1, result,
    commit: before.head === "NO_HEAD" ? "0000000" : before.head, dirty: before.dirty, fingerprint: before.fingerprint,
    environment: environment(`; duration ${Date.now() - started}ms${child.error ? `; error ${child.error.code}` : ""}`),
    outputSha256: sha256(output), excerpt: output.slice(-3500), recordedAt: nowIso(), producer,
  }));
}

/** The verdict is the report's last non-empty line, so quoted instructions cannot fake it. */
export function reportVerdict(report) {
  const last = report.split("\n").map((l) => l.trim()).filter(Boolean).at(-1) || "";
  return last.match(/^VERDICT:\s*(PASS|FAIL)$/)?.[1] ?? null;
}

/** A completed independent review. The reviewer's full report must be attached. */
export function recordReview({ reviewer, verdict, summary, findings = [], criteria = [], reportFile }) {
  if (!["PASS", "FAIL"].includes(verdict)) throw new OsError("USAGE", "--verdict must be PASS or FAIL");
  if (!reviewer) throw new OsError("USAGE", "--reviewer is required");
  if (!reportFile || !fs.existsSync(reportFile)) throw new OsError("USAGE", "--report must point to the reviewer's full output");
  const report = fs.readFileSync(reportFile, "utf8");
  if (reportVerdict(report) !== verdict) throw new OsError("VERDICT_MISMATCH", `the report's last line must be exactly "VERDICT: ${verdict}"`);
  checkLinks(criteria, findings);
  const ws = workspaceFingerprint();
  return persist((id) => ({
    id, kind: "review", findings, criteria, summary: summary || `${reviewer}: ${verdict}`, result: verdict,
    commit: ws.head, dirty: ws.dirty, fingerprint: ws.fingerprint, environment: `review by ${reviewer}; report ${path.relative(REPO_ROOT, path.resolve(reportFile))}`,
    outputSha256: sha256(report), excerpt: report.slice(-3500), recordedAt: nowIso(), producer: reviewer,
  }));
}

export function isFresh(record, ws = workspaceFingerprint()) {
  return record.fingerprint === ws.fingerprint;
}

/** PASS evidence that is about this finding (names it) and describes the current workspace. */
export function provesFinding(record, findingId, ws) {
  return record.result === "PASS" && (record.findings || []).includes(findingId) && (!ws || isFresh(record, ws));
}
