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
// Explicit npm scripts only (a broad `test:*` pattern would admit suites of unrelated tooling).
const NPM_PROOF = new Set(["test", "test:auth", "test:spotify", "test:database", "test:unit", "test:integration", "test:browser", "test:claude-os"]);
const NPM_VERIFY_EXTRA = new Set(["typecheck", "build", "lint", "os:validate"]);
// Variables a verify/proof command may set. Anything that changes how node/npm run (NODE_OPTIONS,
// NODE_TEST_CONTEXT, PATH, npm_config_*) could make a failing suite exit 0, so it is never accepted.
export const ALLOWED_ENV = new Set(["DATABASE_URL", "TEST_DATABASE_URL", "OS_BASE_URL", "PLAYWRIGHT_BASE_URL", "PLAYWRIGHT_CHROMIUM_EXECUTABLE", "E2E_CONTACT_SUBMIT", "NEXT_PUBLIC_SITE_URL"]);

/** Strips a leading `env NAME=value ...` prefix; returns null if any name is not allow-listed. */
function unwrapEnv(argv) {
  let i = 0;
  if (argv[0] === "env") {
    i = 1;
    while (i < argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[i])) {
      if (!ALLOWED_ENV.has(argv[i].slice(0, argv[i].indexOf("=")))) return null;
      i += 1;
    }
    if (argv[i]?.startsWith("-")) return null; // env options (-i, -u, -S …) change the environment in other ways
  }
  return argv.slice(i);
}

function classify(argv) {
  const cmd = unwrapEnv(argv);
  if (!cmd) return null;
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
    if (NPM_PROOF.has(script)) return "proof";
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

/**
 * True when a test run executed nothing: a zero-count summary, Playwright's "No tests found", or a node:test
 * file-level entry (a file with no test() calls is reported as one passing "test" named after the file).
 */
export function ranNothing(output) {
  return /^# tests 0$/m.test(output) || /No tests found/i.test(output) || /^\s*ok \d+ - [\w./-]+\.(test|spec)\.(mjs|cjs|js|ts)\s*$/m.test(output);
}
