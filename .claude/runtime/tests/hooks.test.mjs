import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { OS_SOURCE } from "./helpers.mjs";
import { evaluate } from "../hooks/guard-bash.mjs";

const blocked = [
  "git reset --hard origin/dev", "git reset HEAD~3 --hard", "git -C . reset --hard", "git clean -fd", "git clean -fdx",
  "git push --force origin x", "git push -f", "git push origin +main", "git push origin :dev", "git branch -D feature", "git branch -Df x",
  "git checkout -- .", "git checkout HEAD -- .", "git restore .", "git restore --staged --worktree .", "git stash clear", "git stash drop",
  "git filter-branch --all", "git reflog expire --all", "cd x && git reset --hard",
  "rm -rf .git", "rm -rf ./migrations", "rm --recursive --force .git", "rm -rf \"$PWD\"", "rm -rf .claude*", "rm -rf ~", "rm -rf *",
  "psql $PROD -c 'DROP TABLE contact_submissions'", "psql $PROD -c 'DROP TABLE users' # lander_test",
  "psql postgres://localhost@prod.example.com/lander_test -c 'TRUNCATE x'", "dropdb prod",
  "cat .env.local", "cat .env", "cat .env.staging", "printenv", "printenv DATABASE_URL", "env", "export -p",
  "node -e \"console.log(require('fs').readFileSync('.env','utf8'))\"", "echo $SOUNDCHARTS_CLIENT_SECRET",
  "DATABASE_URL=postgres://u@db.prod.example:5432/x npm run db:migrate", "npm run db:migrate",
  "DATABASE_URL=postgres://localhost@prod.example.com/db npm run db:migrate",
  "git push origin HEAD:main --force-with-lease", "git push --force-if-includes --force-with-lease", "sh -c \"git reset --hard\"",
  "bash -c 'rm -rf .git'", "x=$(git reset --hard)", "echo `git clean -fdx`", "eval \"git reset --hard\"", "/bin/rm -rf .git",
  "rm -rf ..", "find . -delete", "find . -name .git -exec rm -rf {} +", "git switch --discard-changes main",
  "cat .en''v", "node -e 'console.log(process.env)'", "set",
  "rm -rf $(pwd)", "git checkout -- src/", "git restore src/", "git update-ref refs/heads/main HEAD~3",
  "git -c alias.x='reset --hard' x", "git config alias.nuke '!git reset --hard'", "bash<<<'git reset --hard'",
  "bash -lc 'git reset --hard'", "bash -c -- 'git reset --hard'", "find . -execdir rm {} +", "find /var/tmp/../home -delete",
  "export", "cat /proc/self/environ", "python3 -c 'import os;print(os.environ)'", "cat .e?v", "cat .env*",
  "node -e 'console.log(process.env.DATABASE_URL)'",
  // Round-4 security review.
  "git checkout -- lib", "git checkout HEAD -- lib", "git restore --source=HEAD lib", "git restore -W -- lib",
  "git --config-env=alias.x=V x", "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=alias.x GIT_CONFIG_VALUE_0=reset git x",
  "git branch -f main HEAD~5", "git worktree remove --force ../w", "typeset", "cat /proc/$$/environ", "ps eww",
  "awk 'BEGIN{for(k in ENVIRON)print k}'", "perl -e 'print %ENV'", "ruby -e 'p ENV'", "node -p 'process[\"env\"]'",
  "node -p 'require(\"process\").env'", "python3 -c 'import os;print(os.getenv(\"SOUNDCHARTS_CLIENT_SECRET\"))'",
  "echo 'DROP TABLE users' | psql $DATABASE_URL",
];
const allowed = [
  "git status", "git push -u origin claude/x", "git checkout -b new", "git checkout dev", "git restore --staged .", "cat .env.production.example",
  "find /var/tmp/x -delete", "node -e 'console.log(process.env.NODE_ENV)'", "git commit -m \"fix #12\"",
  "git checkout -- next-env.d.ts", "git config user.name x", "cd /var/tmp && rm -rf build", "rm -rf ./node_modules/.cache",
  "git log --grep='git reset --hard'", "grep -r TRUNCATE lib", "git diff -- .", "git add .", "git restore --staged lib/x.ts",
  "cat .env.example", "rm -rf /var/tmp/pw-results", "rm -rf node_modules/.cache", "npm test",
  "psql -h /var/tmp/lander-pg -p 55432 -U postgres -c 'drop database if exists lander_path_test'",
  "psql -h /var/tmp/lander-pg -p 55432 -U postgres lander_test -c 'delete from contact_submissions where id=1'",
  "DATABASE_URL=postgresql://postgres@localhost:55432/lander_test npm run db:migrate",
  "node -e \"console.log(1)\"",
  "git branch feature", "ps aux", "git restore --staged lib", "echo 'SELECT 1' | psql postgresql://postgres@localhost:55432/lander_test",
];

test("guard blocks destructive and secret-exposing commands (incl. reviewer bypasses)", () => {
  for (const cmd of blocked) assert.ok(evaluate(cmd), `should block: ${cmd}`);
});
test("guard allows normal engineering commands", () => {
  for (const cmd of allowed) assert.equal(evaluate(cmd), null, `should allow: ${cmd}`);
});
test("hook fails closed and works through paths with spaces and symlinks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard hook "));
  const copy = path.join(dir, "guard-bash.mjs");
  fs.copyFileSync(path.join(OS_SOURCE, "runtime", "hooks", "guard-bash.mjs"), copy);
  const link = path.join(dir, "link.mjs");
  fs.symlinkSync(copy, link);
  try {
    for (const hook of [copy, link]) {
      const run = (input) => spawnSync(process.execPath, [hook], { input, encoding: "utf8" });
      const denied = run(JSON.stringify({ tool_name: "Bash", tool_input: { command: "git reset --hard" } }));
      assert.equal(denied.status, 2, hook);
      assert.match(denied.stderr, /git-guardian/);
      assert.equal(run(JSON.stringify({ tool_name: "Bash", tool_input: { command: "git status" } })).status, 0);
      assert.equal(run("not json").status, 2, "bad input must fail closed");
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("rm of the repository root or its ancestors by absolute path is blocked", () => {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  assert.ok(evaluate(`rm -rf ${root}`));
  assert.ok(evaluate(`rm -rf ${root}/`));
  assert.ok(evaluate("rm -rf /"));
  assert.equal(evaluate(`rm -rf ${root}/node_modules/.cache`), null);
});

test("cd tracking: deleting the repository from its parent is blocked", () => {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const name = root.split("/").filter(Boolean).at(-1);
  assert.ok(evaluate(`cd .. && rm -rf ${name}`));
  assert.ok(evaluate(`cd / && rm -rf ${root.slice(1)}`));
});

test("a checkout that lives under /tmp gets no scratch exemption for its own files", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "guard-repo-"));
  try {
    const hook = path.join(OS_SOURCE, "runtime", "hooks", "guard-bash.mjs");
    const script = `import(${JSON.stringify(hook)}).then(({ evaluate }) => console.log(JSON.stringify(["find . -delete", "find lib -delete", "find . -exec rm {} +", "find node_modules/.cache -delete"].map((c) => evaluate(c)))))`;
    const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: repo, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: repo } });
    assert.equal(out.status, 0, out.stderr);
    const [dot, lib, exec, cache] = JSON.parse(out.stdout.trim());
    assert.ok(dot && lib && exec, "repository paths must stay protected");
    assert.equal(cache, null, "build output inside the repository stays deletable");
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});
