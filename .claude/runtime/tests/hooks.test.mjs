import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { OS_SOURCE } from "./helpers.mjs";
import { evaluate } from "../hooks/guard-bash.mjs";

const blocked = [
  "git reset --hard origin/dev", "git clean -fd", "git clean -fdx", "git push --force origin x", "git push -f",
  "git branch -D feature", "git checkout -- .", "git restore .", "rm -rf .git", "rm -rf ./migrations",
  "psql $PROD -c 'DROP TABLE contact_submissions'", "cat .env.local", "cat .env", "printenv",
  "DATABASE_URL=postgres://u@db.prod.example:5432/x npm run db:migrate",
];
const allowed = [
  "git status", "git push -u origin claude/x", "git push --force-with-lease origin claude/x", "git checkout -b new",
  "cat .env.example", "rm -rf /var/tmp/pw-results", "npm test",
  "psql -h /var/tmp/lander-pg -p 55432 -U postgres -c 'drop database if exists lander_path_test'",
  "DATABASE_URL=postgresql://postgres@localhost:55432/lander_test npm run db:migrate",
];

test("guard blocks destructive and secret-exposing commands", () => {
  for (const cmd of blocked) assert.ok(evaluate(cmd), `should block: ${cmd}`);
});
test("guard allows normal engineering commands", () => {
  for (const cmd of allowed) assert.equal(evaluate(cmd), null, `should allow: ${cmd}`);
});
test("hook process exits 2 with the reason on stdin JSON", () => {
  const hook = path.join(OS_SOURCE, "runtime", "hooks", "guard-bash.mjs");
  const run = (command) => spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }), encoding: "utf8" });
  const denied = run("git reset --hard");
  assert.equal(denied.status, 2);
  assert.match(denied.stderr, /git-guardian/);
  assert.equal(run("git status").status, 0);
});
