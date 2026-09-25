import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OsError, osPath, readJson, createRecord, nowIso, sha256, workspaceFingerprint, REPO_ROOT, RUN_DIR, splitCommand, childEnv, resolveArgv } from "./io.mjs";
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
// Called under the evidence directory lock (createRecord), so the head cannot move while linking.
const chainHead = (id) => loadEvidence({ except: id }).filter((r) => r.id < id).at(-1)?.hash ?? "GENESIS";

export { isProofArgv } from "./commands.mjs";
import { isProofArgv as proofArgv, ranNothing } from "./commands.mjs";
import { currentMission, missionHash } from "./mission-def.mjs";
/** Proof check for a recorded command: uses the stored argv (legacy records: whitespace split). */
export const isProofCommand = (command = "", argv) => proofArgv(argv || splitCommand(command), { requireFiles: false });

function activeMission() {
  const current = currentMission();
  return current?.status === "ACTIVE" ? current : null;
}

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

/** Criteria must belong to the ACTIVE mission and the command must be exactly the criterion's declared verify command. */
function checkLinks(criteria, findings, argv) {
  const mission = activeMission();
  if (criteria.length) {
    const declared = new Map((mission?.requirements || []).flatMap((r) => r.criteria.map((c) => [c.id, c.verify])));
    const unknown = criteria.filter((c) => !declared.has(c));
    if (unknown.length) throw new OsError("UNKNOWN_CRITERION", `criteria not in the active mission: ${unknown.join(", ")}`);
    for (const c of criteria) {
      if (!declared.get(c)) throw new OsError("NO_VERIFY_COMMAND", `${c} has no declared verify command`);
      if (!argv || JSON.stringify(splitCommand(declared.get(c))) !== JSON.stringify(argv)) throw new OsError("CRITERION_COMMAND_MISMATCH", `${c} can only be closed by its declared command: ${declared.get(c)}`);
    }
  }
  const unknownFindings = findings.filter((f) => !fs.existsSync(osPath("findings", `${f}.json`)));
  if (unknownFindings.length) throw new OsError("UNKNOWN_FINDING", `unknown findings: ${unknownFindings.join(", ")}`);
  return mission?.id ?? null;
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
  const mission = checkLinks(criteria, findings, argv);
  if (findings.length && !proofArgv(argv)) throw new OsError("NOT_A_PROOF", "evidence naming a finding must run an allow-listed test suite, OS probe or schema audit (lib/commands.mjs)");
  const before = workspaceFingerprint();
  const started = Date.now();
  const [bin, ...rest] = resolveArgv(argv);
  const child = spawnSync(bin, rest, { cwd: REPO_ROOT, env: childEnv(env), encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, shell: false });
  const output = `${child.stdout || ""}${child.stderr || ""}`;
  // Missing binary / permission = environment gap (BLOCKED). A timeout is the command failing (FAIL).
  const blocked = child.error && ["ENOENT", "EACCES", "EPERM"].includes(child.error.code);
  // A test run that executed nothing proves nothing.
  const result = blocked ? "BLOCKED" : child.status === 0 && !ranNothing(output, argv) ? "PASS" : "FAIL";
  const after = workspaceFingerprint();
  if (after.fingerprint !== before.fingerprint) throw new OsError("WORKSPACE_CHANGED", "the workspace changed while the command ran; evidence would not describe a single state");
  return persist((id) => ({
    id, kind, findings, criteria, mission,
    summary: summary || `${argv.join(" ")} -> ${result}`,
    command: argv.join(" "), argv, exitCode: typeof child.status === "number" ? child.status : -1, result,
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

/** Review tickets are minted by dispatch.mjs and bind a report to the role and the exact dispatched workspace. */
export const TICKET_DIR = `${RUN_DIR}/tickets`;
export function reportTicket(report) { return report.match(/^`?REVIEW-TICKET:\s*([0-9a-f]{32})`?\s*$/m)?.[1] ?? null; }

/** A completed independent review. The reviewer's full report must be attached and carry its dispatch ticket. */
export function recordReview({ reviewer, verdict, summary, findings = [], criteria = [], reportFile }) {
  if (!["PASS", "FAIL"].includes(verdict)) throw new OsError("USAGE", "--verdict must be PASS or FAIL");
  if (!reviewer) throw new OsError("USAGE", "--reviewer is required");
  if (criteria.length) throw new OsError("USAGE", "reviews never close criteria");
  if (!reportFile || !fs.existsSync(reportFile)) throw new OsError("USAGE", "--report must point to the reviewer's full output");
  const report = fs.readFileSync(reportFile, "utf8");
  if (reportVerdict(report) !== verdict) throw new OsError("VERDICT_MISMATCH", `the report's last line must be exactly "VERDICT: ${verdict}"`);
  const ws = workspaceFingerprint();
  const nonce = reportTicket(report);
  let ticket = null;
  if (verdict === "PASS") {
    // A PASS must prove it reviewed exactly the current code, as dispatched to this role.
    if (!nonce || !fs.existsSync(`${TICKET_DIR}/${nonce}.json`)) throw new OsError("TICKET_REQUIRED", "a PASS review needs the REVIEW-TICKET line issued by dispatch.mjs");
    ticket = readJson(`${TICKET_DIR}/${nonce}.json`);
    if (ticket.role !== reviewer) throw new OsError("TICKET_MISMATCH", `ticket was issued to ${ticket.role}, not ${reviewer}`);
    if (ticket.fingerprint !== ws.fingerprint) throw new OsError("TICKET_STALE", "the code changed since this review was dispatched; dispatch a new review");
    if (evidenceUsesTicket(nonce)) throw new OsError("TICKET_USED", "this ticket already backs a review record");
    if (ticket.missionHash !== missionHash(currentMission())) throw new OsError("TICKET_STALE", "the mission definition changed since this review was dispatched; dispatch a new review");
  }
  const mission = checkLinks([], findings);
  return persist((id) => ({
    id, kind: "review", findings, criteria: [], mission, missionHash: ticket?.missionHash ?? missionHash(currentMission()), ...(nonce ? { ticket: nonce } : {}), summary: summary || `${reviewer}: ${verdict}`, result: verdict,
    commit: ws.head, dirty: ws.dirty, fingerprint: ticket?.fingerprint ?? ws.fingerprint, environment: `review by ${reviewer}; report ${path.relative(REPO_ROOT, path.resolve(reportFile))}`,
    outputSha256: sha256(report), excerpt: report.slice(-3500), recordedAt: nowIso(), producer: reviewer,
  }));
}
const evidenceUsesTicket = (nonce) => loadEvidence().some((e) => e.ticket === nonce);

export function isFresh(record, ws = workspaceFingerprint()) {
  return record.fingerprint === ws.fingerprint;
}

/** PASS evidence that is about this finding (names it) and describes the current workspace. */
export function provesFinding(record, findingId, ws) {
  return record.result === "PASS" && record.kind !== "review" && isProofCommand(record.command, record.argv) && (record.findings || []).includes(findingId) && (!ws || isFresh(record, ws));
}
