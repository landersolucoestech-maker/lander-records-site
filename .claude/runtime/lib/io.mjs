// Core I/O for the Lander Records Engineering OS runtime. Dependency-free (Node >= 22 built-ins only).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const OS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const REPO_ROOT = path.resolve(OS_DIR, "..");
export const RUN_DIR = path.join(OS_DIR, "state", ".run");

export class OsError extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}

export const osPath = (...parts) => path.join(OS_DIR, ...parts);
export const repoPath = (...parts) => path.join(REPO_ROOT, ...parts);
export const rel = (full) => path.relative(REPO_ROOT, full).split(path.sep).join("/");
export const nowIso = () => new Date().toISOString();
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }

/** ADR-0002: .yml files are JSON documents optionally preceded by '#' comment lines. */
export function readYml(file) {
  const text = fs.readFileSync(file, "utf8");
  const body = text.split("\n").filter((line) => !line.startsWith("#")).join("\n").trim();
  try { return JSON.parse(body); } catch (error) { throw new OsError("YML_NOT_JSON", `${rel(file)} is not JSON-compatible YAML: ${error.message}`); }
}
export function writeYml(file, header, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = String(header).split("\n").map((line) => `# ${line}`);
  lines.push("# Format: JSON-compatible YAML (ADR-0002). Written by .claude/runtime.");
  atomicWrite(file, `${lines.join("\n")}\n${JSON.stringify(value, null, 2)}\n`);
}
export function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`); }
export function atomicWrite(file, text) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

export function walk(dir, filter = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next" || entry.name === ".run") return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, filter) : filter(full) ? [full] : [];
  });
}

export function git(args, { allowFail = false } = {}) {
  const result = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 && !allowFail) throw new OsError("GIT_FAILED", `git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.status === 0 ? result.stdout.trim() : "";
}

/** Workspace identity: HEAD + staged diff + unstaged diff + untracked file contents (runtime-volatile state excluded). */
export function workspaceFingerprint() {
  const head = git(["rev-parse", "HEAD"], { allowFail: true }) || "NO_HEAD";
  const exclude = [":(exclude).claude/state/.run", ":(exclude).claude/evidence", ":(exclude).claude/state/mission.yml", ":(exclude).claude/state/validation-history.yml"];
  const staged = git(["diff", "--cached", "--binary", "--", ".", ...exclude], { allowFail: true });
  const unstaged = git(["diff", "--binary", "--", ".", ...exclude], { allowFail: true });
  const untracked = git(["ls-files", "--others", "--exclude-standard", "--", ".", ...exclude], { allowFail: true }).split("\n").filter(Boolean).sort();
  const hash = crypto.createHash("sha256").update(head).update("\0").update(staged).update("\0").update(unstaged);
  for (const file of untracked) {
    hash.update(`\0${file}\0`);
    try { hash.update(fs.readFileSync(repoPath(file))); } catch { hash.update("UNREADABLE"); }
  }
  return { head, fingerprint: hash.digest("hex"), dirty: Boolean(staged || unstaged || untracked.length) };
}

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") { out["--"] = argv.slice(index + 1); break; }
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else { out[key] = next; index += 1; }
    } else out._.push(token);
  }
  return out;
}

export function nextId(dir, prefix) {
  const numbers = fs.existsSync(dir) ? fs.readdirSync(dir).map((name) => name.match(new RegExp(`^${prefix}-(\\d{4})`))?.[1]).filter(Boolean).map(Number) : [];
  return `${prefix}-${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(4, "0")}`;
}

export function run(main) {
  Promise.resolve().then(main).catch((error) => {
    const code = error instanceof OsError ? error.code : "RUNTIME_ERROR";
    console.error(JSON.stringify({ ok: false, code, message: error.message, details: error.details ?? {} }, null, 2));
    process.exit(code === "BLOCKED" ? 77 : 1);
  });
}
