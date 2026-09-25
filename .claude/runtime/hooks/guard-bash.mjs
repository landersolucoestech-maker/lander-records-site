#!/usr/bin/env node
// Claude Code PreToolUse hook (settings.json, ADR-0006) enforcing git-guardian, destructive-action-guardian,
// secrets-guardian and migration-guardian on Bash commands. Fails CLOSED: unparseable input blocks.
// It is a guardrail, not a sandbox: it parses common shell forms, not every possible construct (ADR-0007).
import fs from "node:fs";
import path from "node:path";
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
  // GIT_CONFIG_COUNT/KEY_n/VALUE_n in the environment define config (incl. aliases) without -c.
  if (tok.slice(0, i).some((t) => /^GIT_CONFIG_(KEY_\d+|PARAMETERS)=/.test(t))) return { sub: "__alias__", rest: [] };
  let j = i + 1;
  let alias = false;
  while (j < tok.length && tok[j].startsWith("-")) {
    if (tok[j] === "-c" && /^alias\./.test(tok[j + 1] || "")) alias = true;
    if (tok[j].startsWith("--config-env") && /alias\./.test(tok[j].includes("=") ? tok[j] : tok[j + 1] || "")) alias = true;
    if (["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(tok[j])) j += 1;
    j += 1;
  }
  return { sub: alias ? "__alias__" : tok[j], rest: tok.slice(j + 1) };
}
const has = (rest, ...flags) => rest.some((t) => flags.includes(t));
const shortFlag = (rest, letter) => rest.some((t) => /^-[a-zA-Z]+$/.test(t) && t.includes(letter));
const bulkPath = (rest) => rest.some((t) => [".", "./", ":/", "*", ":(top)"].includes(t));

function gitRule({ sub, rest }, cwd = REPO_ROOT) {
  if (sub === "__alias__") return "git-guardian: inline git aliases can hide destructive commands";
  if (sub === "reset" && has(rest, "--hard", "--merge", "--keep")) return "git-guardian: git reset --hard/--merge/--keep discards work";
  if (sub === "clean" && (shortFlag(rest, "f") || has(rest, "--force"))) return "git-guardian: git clean deletes untracked work";
  if (sub === "push" && (rest.some((t) => t.startsWith("--force")) || has(rest, "-f", "--mirror", "--delete", "-d", "--prune") || shortFlag(rest, "f") || rest.some((t) => t.startsWith("+") || t.startsWith(":") || /:\+?[\w/.-]*$/.test(t) && t.includes(":+")))) return "git-guardian: force push (incl. --force-with-lease) / remote deletion rewrites published history";
  if (sub === "branch" && (shortFlag(rest, "D") || shortFlag(rest, "f") || has(rest, "--force") || (has(rest, "--delete", "-d") && has(rest, "--force", "-f")))) return "git-guardian: forced branch deletion";
  if (sub === "checkout" && (bulkPath(rest) || has(rest, "-f", "--force") || (has(rest, "--") && rest.slice(rest.indexOf("--") + 1).some((t) => [".", "./", ":/", "*"].includes(t))))) return "git-guardian: bulk checkout discards changes";
  // `git restore --staged <path>` only unstages; it discards nothing in the worktree.
  const onlyUnstage = has(rest, "--staged", "-S") && !has(rest, "--worktree", "-W");
  if (sub === "restore" && bulkPath(rest) && !onlyUnstage) return "git-guardian: bulk restore discards changes";
  if (sub === "switch" && has(rest, "--discard-changes", "-f", "--force")) return "git-guardian: switch --discard-changes discards work";
  if (sub === "worktree" && rest[0] === "remove" && (has(rest, "--force") || shortFlag(rest, "f"))) return "git-guardian: forced worktree removal discards its changes";
  if (sub === "stash" && ["clear", "drop"].includes(rest[0])) return "git-guardian: stash clear/drop destroys saved work";
  if (sub === "config" && rest.some((t) => /^alias\./.test(t))) return "git-guardian: defining git aliases can hide destructive commands";
  // A pathspec naming a directory (trailing slash or an existing directory) discards everything under it.
  const isDir = (t) => !t.startsWith("-") && (t.endsWith("/") || (() => { try { return fs.statSync(path.resolve(cwd, t)).isDirectory(); } catch { return false; } })());
  if (sub === "checkout" && (has(rest, "--") ? rest.slice(rest.indexOf("--") + 1) : rest).some(isDir)) return "git-guardian: checkout of a directory discards its changes";
  if (sub === "restore" && !onlyUnstage && rest.some(isDir)) return "git-guardian: restore of a directory discards its changes";
  if (["filter-branch", "filter-repo", "replace", "update-ref"].includes(sub) || (sub === "rebase" && has(rest, "-i", "--interactive", "--root")) || (sub === "reflog" && rest[0] === "expire") || (sub === "gc" && rest.some((t) => t.startsWith("--prune")))) return "git-guardian: history rewrite / reflog destruction";
  return null;
}

const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
function dangerousTarget(t) {
  if (/(^|\/)(\.git|\.claude[^/]*|migrations|public\/uploads)(\/|$)|^\$\{?(PWD|HOME|CLAUDE_PROJECT_DIR|OLDPWD)\}?\/?$|^\/$|^\.\/?$|^\.\.(\/.*)?$|^\*$|^~\/?$/.test(t)) return true;
  if (t.startsWith("/")) {
    const target = t.replace(/\/+$/, "") || "/";
    return REPO_ROOT === target || REPO_ROOT.startsWith(`${target}/`);
  }
  return false;
}
function rmRule(tok, cwd) {
  const i = tok.findIndex((t) => t === "rm" || t.endsWith("/rm"));
  if (i >= 0) {
    const args = tok.slice(i + 1);
    const recursive = args.some((t) => t === "--recursive" || (/^-[a-zA-Z]+$/.test(t) && /[rR]/.test(t)));
    if (recursive && args.filter((t) => !t.startsWith("-")).some((t) => dangerousTarget(t) || /^\$\(\s*pwd\s*\)$|^`pwd`$/.test(t) || (!/^[$~]/.test(t) && dangerousTarget(path.resolve(cwd, t))))) return "destructive-action-guardian: recursive delete of repository or home state";
  }
  const f = tok.indexOf("find");
  if (f >= 0 && (tok.includes("-delete") || (tok.some((t) => t === "-exec" || t === "-execdir") && tok.some((t) => t === "rm" || t.endsWith("/rm"))))) {
    const start = tok[f + 1] && !tok[f + 1].startsWith("-") ? tok[f + 1] : ".";
    const resolved = path.resolve(cwd, start);
    // Repository containment is decided first: a checkout that itself lives under /tmp gets no exemption.
    const inRepo = resolved === REPO_ROOT || resolved.startsWith(`${REPO_ROOT}/`) || REPO_ROOT.startsWith(`${resolved}/`);
    const buildOutput = /^(node_modules|\.next|test-results|playwright-report)(\/|$)/.test(path.relative(REPO_ROOT, resolved));
    if (inRepo ? !buildOutput : !/^(\/var\/tmp|\/tmp)(\/|$)/.test(resolved)) return "destructive-action-guardian: find -delete / -exec rm over repository state";
  }
  return null;
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

function secretRule(rawSegment, tok) {
  const segment = rawSegment.replace(/''|""/g, "");
  for (const m of segment.matchAll(/(?:^|[\s'"`(=/<])(\.env(?:\.[\w.-]+)?)(?=$|[\s'"`),;|&<>])/g)) if (!m[1].endsWith(".example")) return "secrets-guardian: env files hold credentials";
  if (tok.length === 1 && ["set", "export", "declare", "typeset", "env"].includes(tok[0])) return "secrets-guardian: dumping shell variables exposes credentials";
  if (/\/proc\/[^/\s]+\/environ|\bos\.environ\b|\bENV\[|\bgetenv\s*\(\s*\)|\bENVIRON\b|%ENV\b|\bprocess\s*\[\s*["'`]env|require\(\s*["'`](node:)?process["'`]\s*\)\s*\.\s*env|\bruby\b.*\bENV\b/.test(segment)) return "secrets-guardian: dumping the environment exposes credentials";
  if (tok[0] === "ps" && tok.slice(1).some((t) => /^[a-zA-Z]*e[a-zA-Z]*$/.test(t))) return "secrets-guardian: ps e prints process environments";
  if (/\bgetenv\s*\(\s*["'][A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL|SALT)/.test(segment)) return "secrets-guardian: printing a credential variable";
  if (/\bprocess\.env\s*(\.\s*|\[\s*["'`])[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL|SALT)/.test(segment)) return "secrets-guardian: printing a credential variable";
  if (/(^|[\s'"`(=/<])\.e[\w?*[\]]*[?*[][\w?*[\]]*(\s|$)|\.env\*/.test(segment)) return "secrets-guardian: globbing env files";
  if (/\bprocess\.env\b(?!\s*\.\s*(NODE_ENV)\b)(?!\s*\.)/.test(segment) || /Object\.(keys|entries|values)\(\s*process\.env/.test(segment)) return "secrets-guardian: dumping process.env exposes credentials";
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

/** Inner command strings a shell would execute: sh/bash/zsh -c "…", eval "…", $(…), `…`. */
function nested(segment, tok) {
  const inner = [];
  const shell = tok.findIndex((t) => /^(\/[\w/]*\/)?(sh|bash|zsh|dash|ksh)$/.test(t));
  if (shell >= 0) {
    const flag = tok.findIndex((t, k) => k > shell && /^-[a-zA-Z]*c[a-zA-Z]*$/.test(t));
    if (flag > 0) { const script = tok.slice(flag + 1).find((t) => t !== "--"); if (script) inner.push(script); }
  }
  // Here-strings / heredoc-style input to a shell, e.g. bash<<<'…' (no space needed before <<<).
  const here = segment.match(/(?:^|[\s/])(?:sh|bash|zsh|dash|ksh)\s*<<<\s*(?:'([^']*)'|"([^"]*)"|(\S+))/);
  if (here) inner.push(here[1] ?? here[2] ?? here[3]);
  if (tok[0] === "eval") inner.push(tok.slice(1).join(" "));
  for (const m of segment.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) inner.push(m[1] ?? m[2]);
  return inner;
}

export function evaluate(command, depth = 0) {
  if (depth > 4) return "guard-bash: command nesting too deep to verify";
  let cwd = REPO_ROOT;
  // SQL piped into a client spans segments (echo 'DROP …' | psql …): judge the whole command too.
  if (segments(String(command)).length > 1) { const whole = sqlRule(String(command), tokens(String(command))); if (whole) return whole; }
  for (const segment of segments(String(command))) {
    const tok = tokens(segment);
    if (tok[0] === "cd") { cwd = !tok[1] || tok[1] === "~" ? (process.env.HOME || "/") : path.resolve(cwd, tok[1]); continue; }
    for (const inner of nested(segment, tok)) { const reason = evaluate(inner, depth + 1); if (reason) return reason; }
    const git = gitSubcommand(tok);
    const reason = (git && gitRule(git, cwd)) || rmRule(tok, cwd) || sqlRule(segment, tok) || secretRule(segment, tok) || migrationRule(segment);
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
