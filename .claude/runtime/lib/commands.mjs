// Anchored command policy (ADR-0007): what may verify a criterion or prove a finding.
// Parses argv from the start; no substring matching. A proof shows that the relevant suite/probe passes —
// it is not, by itself, specific to one finding; the finding's requiredTests say which suite that must be.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./io.mjs";

// Shape is always checked; existence only when a command is being recorded or declared (historical records must
// stay valid after a test file is renamed).
let checkFiles = true;
const safeRel = (p) => typeof p === "string" && !p.startsWith("/") && !p.split("/").includes("..") && (!checkFiles || (fs.existsSync(path.join(REPO_ROOT, p)) && fs.statSync(path.join(REPO_ROOT, p)).isFile()));
const TEST_FILE = /^(tests\/(unit|auth|database|integration|browser)\/[\w.-]+\.(test\.)?(mjs|cjs|ts)|tests\/[\w.-]+\.test\.(mjs|cjs)|\.claude\/runtime\/tests\/[\w.-]+\.test\.mjs)$/;
const SCRIPT_FILE = /^(tests\/(integration|database)\/[\w.-]+\.mjs|\.claude\/runtime\/probes\/[\w.-]+\.mjs|scripts\/audit-db\.mjs)$/;
const NPM_PROOF = /^(test|test:[\w-]+)$/;
const NPM_VERIFY_EXTRA = new Set(["typecheck", "build", "lint", "os:validate"]);

/** Strips a leading `env VAR=value ...` prefix; values may not smuggle commands (they are plain strings). */
function unwrapEnv(argv) {
  let i = 0;
  if (argv[0] === "env") { i = 1; while (i < argv.length && /^[A-Z_][A-Z0-9_]*=/.test(argv[i])) i += 1; }
  return argv.slice(i);
}

function classify(argv) {
  const cmd = unwrapEnv(argv);
  const [bin, ...rest] = cmd;
  if (bin === "node") {
    const opts = [];
    let j = 0;
    while (j < rest.length && rest[j].startsWith("--")) { opts.push(rest[j]); j += 1; }
    const files = rest.slice(j);
    if (!opts.every((o) => ["--no-warnings", "--test", "--test-concurrency=1"].includes(o))) return null;
    if (opts.includes("--test")) return files.length && files.every((f) => TEST_FILE.test(f) && safeRel(f)) ? "proof" : null;
    return files.length === 1 && SCRIPT_FILE.test(files[0]) && safeRel(files[0]) ? "proof" : null;
  }
  if (bin === "npm") {
    const script = rest[0] === "run" ? rest[1] : rest[0] === "test" ? "test" : null;
    const extra = rest[0] === "run" ? rest.slice(2) : rest.slice(1);
    if (!script || extra.length) return null;
    if (NPM_PROOF.test(script)) return "proof";
    return NPM_VERIFY_EXTRA.has(script) ? "verify" : null;
  }
  if (bin === "npx" && rest[0] === "playwright" && rest[1] === "test") {
    const files = rest.slice(2);
    return files.every((f) => /^tests\/browser\/[\w.-]+\.spec\.ts$/.test(f) && safeRel(f)) ? "proof" : null;
  }
  return null;
}

function withFiles(requireFiles, fn) { const prev = checkFiles; checkFiles = requireFiles; try { return fn(); } finally { checkFiles = prev; } }
export const isProofArgv = (argv, { requireFiles = true } = {}) => withFiles(requireFiles, () => classify(argv) === "proof");
export const isVerifyArgv = (argv, { requireFiles = true } = {}) => withFiles(requireFiles, () => ["proof", "verify"].includes(classify(argv)));
