#!/usr/bin/env node
// Claude Code PreToolUse hook (settings.json) enforcing guardians/git-guardian, destructive-action-guardian
// and secrets-guardian on Bash commands. Exit 2 blocks the call and returns the reason to the agent.
import fs from "node:fs";

export const RULES = [
  [/\bgit\s+reset\s+(--hard|--merge|--keep)\b/, "git-guardian: git reset --hard/--merge/--keep discards work"],
  [/\bgit\s+clean\s+(-[a-zA-Z]*[fdxX][a-zA-Z]*\b|--force)/, "git-guardian: git clean deletes untracked work"],
  [/\bgit\s+push\b[^|;&]*\s(--force(?!-with-lease)\b|-f\b)/, "git-guardian: force push rewrites published history"],
  [/\bgit\s+branch\s+(-D|--delete\s+--force)\b/, "git-guardian: forced branch deletion"],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, "git-guardian: bulk checkout/restore discards every change"],
  [/\bgit\s+(filter-branch|filter-repo|rebase\s+-i)\b/, "git-guardian: history rewrite"],
  [/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(?:[^|;&]*?[\s/])?(\.git|\.claude|migrations|public\/uploads)(\/|\s|$)/, "destructive-action-guardian: recursive delete of repository state"],
  [/\b(DROP\s+(TABLE|DATABASE|SCHEMA|TYPE)|TRUNCATE\s+)/i, "destructive-action-guardian: destructive SQL (allowed only against local *_test databases)", (cmd) => /(localhost|127\.0\.0\.1|\/var\/tmp)[^\s]*_test\b|lander_[a-z_]*test\b/.test(cmd)],
  [/\b(cat|less|more|head|tail|bat|grep|source)\s[^|;&]*\.env(\.local|\.production|\.development|\.test)?(\s|$)/, "secrets-guardian: reading an env file exposes credentials"],
  [/\b(printenv|env)\s*($|\|)/, "secrets-guardian: dumping the environment exposes credentials"],
  [/\bnpm\s+run\s+db:migrate\b/, "migration-guardian: only against a local database (DATABASE_URL must be localhost)", (cmd) => /DATABASE_URL=postgres(ql)?:\/\/[^@\s]*@?(localhost|127\.0\.0\.1)/.test(cmd) || !/DATABASE_URL=/.test(cmd)],
];

export function evaluate(command) {
  for (const [pattern, reason, allow] of RULES) if (pattern.test(command) && !(allow && allow(command))) return reason;
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }
  const command = String(input.tool_input?.command || "");
  const reason = evaluate(command);
  if (reason) {
    console.error(`${reason}. Blocked by .claude/runtime/hooks/guard-bash.mjs — ask the operator for explicit authorization in this conversation.`);
    process.exit(2);
  }
}
