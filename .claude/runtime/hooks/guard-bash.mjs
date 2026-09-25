#!/usr/bin/env node
// Claude Code PreToolUse hook (settings.json, ADR-0006) enforcing git-guardian, destructive-action-guardian,
// secrets-guardian and migration-guardian on Bash commands. Fails CLOSED: unparseable input blocks.
// It is a guardrail, not a sandbox: it parses common shell forms, not every possible construct (ADR-0007).
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Splits a command line into simple command segments (on ; && || | newlines), ignoring quoted separators. */
export function segments(command) {
  const out = [];
  let cur = "", quote = null;
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === "#" && (i === 0 || /\s/.test(command[i - 1]))) { while (i < command.length && command[i] !== "\n") i += 1; out.push(cur); cur = ""; continue; }
    if (ch === ";" || ch === "\n" || ch === "|" || (ch === "&" && command[i + 1] === "&")) { out.push(cur); cur = ""; if (command[i + 1] === ch) i += 1; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}
const tokens = (segment) => [...segment.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);

function gitSubcommand(tok) {
  const i = tok.findIndex((t) => t === "git" || t.endsWith("/git"));
  if (i < 0) return null;
  let j = i + 1;
  while (j < tok.length && tok[j].startsWith("-")) { if (["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(tok[j])) j += 1; j += 1; }
  return { sub: tok[j], rest: tok.slice(j + 1) };
}
const has = (rest, ...flags) => rest.some((t) => flags.includes(t));
const shortFlag = (rest, letter) => rest.some((t) => /^-[a-zA-Z]+$/.test(t) && t.includes(letter));
const bulkPath = (rest) => rest.some((t) => [".", "./", ":/", "*", ":(top)"].includes(t));

function gitRule({ sub, rest }) {
  if (sub === "reset" && has(rest, "--hard", "--merge", "--keep")) return "git-guardian: git reset --hard/--merge/--keep discards work";
  if (sub === "clean" && (shortFlag(rest, "f") || has(rest, "--force"))) return "git-guardian: git clean deletes untracked work";
  if (sub === "push" && (has(rest, "--force", "-f", "--mirror", "--delete", "-d") || shortFlag(rest, "f") || rest.some((t) => t.startsWith("+") || t.startsWith(":")))) return "git-guardian: force push / remote deletion rewrites published history";
  if (sub === "branch" && (shortFlag(rest, "D") || (has(rest, "--delete", "-d") && has(rest, "--force", "-f")))) return "git-guardian: forced branch deletion";
  if (sub === "checkout" && (bulkPath(rest) || has(rest, "-f", "--force") || (has(rest, "--") && rest.slice(rest.indexOf("--") + 1).some((t) => [".", "./", ":/", "*"].includes(t))))) return "git-guardian: bulk checkout discards changes";
  if (sub === "restore" && bulkPath(rest)) return "git-guardian: bulk restore discards changes";
  if (sub === "stash" && ["clear", "drop"].includes(rest[0])) return "git-guardian: stash clear/drop destroys saved work";
  if (["filter-branch", "filter-repo", "replace"].includes(sub) || (sub === "rebase" && has(rest, "-i", "--interactive", "--root")) || (sub === "update-ref" && has(rest, "-d")) || (sub === "reflog" && rest[0] === "expire") || (sub === "gc" && rest.some((t) => t.startsWith("--prune")))) return "git-guardian: history rewrite / reflog destruction";
  return null;
}

function rmRule(tok) {
  const i = tok.indexOf("rm");
  if (i < 0) return null;
  const args = tok.slice(i + 1);
  const recursive = args.some((t) => t === "--recursive" || (/^-[a-zA-Z]+$/.test(t) && /[rR]/.test(t)));
  if (!recursive) return null;
  const targets = args.filter((t) => !t.startsWith("-"));
  const dangerous = targets.some((t) => /(^|\/)(\.git|\.claude[^/]*|migrations|public\/uploads)(\/|$)|^\$\{?(PWD|HOME|CLAUDE_PROJECT_DIR)\}?\/?$|^\/$|^\.\/?$|^\*$|^~\/?$/.test(t));
  return dangerous ? "destructive-action-guardian: recursive delete of repository or home state" : null;
}

/** Connection targets referenced by a segment: postgres URLs and psql -h/-d flags. */
function dbTargets(segment, tok) {
  const hosts = [], dbs = [];
  for (const m of segment.matchAll(/postgres(?:ql)?:\/\/[^\s'"]+/g)) {
    try { const u = new URL(m[0]); hosts.push(u.hostname || "localhost"); dbs.push(u.pathname.replace(/^\//, "")); } catch { hosts.push("?"); }
  }
  tok.forEach((t, i) => {
    if (t === "-h" || t === "--host") hosts.push(tok[i + 1] || "?");
    if (t === "-d" || t === "--dbname") dbs.push(tok[i + 1] || "?");
  });
  const psql = tok.indexOf("psql");
  if (psql >= 0) { const positional = tok.slice(psql + 1).filter((t, k, arr) => !t.startsWith("-") && !["-h", "-p", "-U", "-c", "-d", "--host", "--port", "--username", "--command", "--dbname"].includes(arr[k - 1])); if (positional[0]) dbs.push(positional[0]); }
  // DROP DATABASE destroys the named database, not the one the client connects to.
  const dropped = [...segment.matchAll(/DROP\s+DATABASE\s+(?:IF\s+EXISTS\s+)?"?(\w+)/gi)].map((m) => m[1]);
  if (dropped.length) dbs.splice(0, dbs.length, ...dropped);
  const isLocal = (h) => LOCAL_HOSTS.has(h) || h.startsWith("/var/tmp") || h.startsWith("/tmp") || h.startsWith("/var/run/postgresql");
  return { hosts, dbs, local: hosts.length > 0 && hosts.every(isLocal), testDb: dbs.length > 0 && dbs.every((d) => /_test$/.test(d)) };
}

function sqlRule(segment, tok) {
  const client = tok.some((t) => ["psql", "pg_restore", "dropdb"].includes(t)) || /\bnode\s+(-e|--eval)\b/.test(segment);
  if (!client) return null;
  if (tok.includes("dropdb") || /\b(DROP\s+(TABLE|DATABASE|SCHEMA|TYPE|OWNED)|TRUNCATE\b|DELETE\s+FROM\s+\w+\s*(;|'|"|$))/i.test(segment)) {
    const t = dbTargets(segment, tok);
    if (!(t.local && t.testDb)) return "destructive-action-guardian: destructive SQL is allowed only against local *_test databases";
  }
  return null;
}

function secretRule(segment, tok) {
  for (const m of segment.matchAll(/(?:^|[\s'"`(=/<])(\.env(?:\.[\w.-]+)?)(?=$|[\s'"`),;|&<>])/g)) if (m[1] !== ".env.example") return "secrets-guardian: env files hold credentials";
  if (tok[0] === "printenv" || tok.includes("printenv") || (tok[0] === "env" && tok.length === 1) || (["export", "declare", "typeset"].includes(tok[0]) && tok.some((t) => /^-[a-zA-Z]*[px]/.test(t)))) return "secrets-guardian: dumping the environment exposes credentials";
  if (/\b(echo|printf)\b[^#]*\$\{?[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL|SALT)/.test(segment)) return "secrets-guardian: printing a credential variable";
  return null;
}

function migrationRule(segment) {
  if (!/\bdb:migrate\b|scripts\/migrate\.mjs|db-0010-release\.mjs/.test(segment)) return null;
  const inline = segment.match(/\bDATABASE_URL=(\S+)/);
  if (!inline) return "migration-guardian: set DATABASE_URL inline to a local database so the target is verifiable";
  try { const u = new URL(inline[1].replace(/^["']|["']$/g, "")); if (LOCAL_HOSTS.has(u.hostname)) return null; } catch { /* fall through */ }
  return "migration-guardian: migrations run only against a local database (use the guarded release path for remote targets)";
}

export function evaluate(command) {
  for (const segment of segments(String(command))) {
    const tok = tokens(segment);
    const git = gitSubcommand(tok);
    const reason = (git && gitRule(git)) || rmRule(tok) || sqlRule(segment, tok) || secretRule(segment, tok) || migrationRule(segment);
    if (reason) return reason;
  }
  return null;
}

function isMain() {
  try { return fs.realpathSync(process.argv[1] || "") === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (isMain()) {
  let command;
  try { command = JSON.parse(fs.readFileSync(0, "utf8")).tool_input?.command; } catch { command = undefined; }
  if (typeof command !== "string") { console.error("guard-bash: could not read the command from hook input; blocking (fail closed)."); process.exit(2); }
  const reason = evaluate(command);
  if (reason) {
    console.error(`${reason}. Blocked by .claude/runtime/hooks/guard-bash.mjs — ask the operator for explicit authorization in this conversation.`);
    process.exit(2);
  }
}
