import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const OS_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Copies .claude into a fresh git repository that has nothing else (no node_modules, no other packs). */
export function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lander-os-"));
  fs.cpSync(OS_SOURCE, path.join(root, ".claude"), { recursive: true, filter: (src) => !src.includes(`${path.sep}.run`) });
  const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "-q"); git("config", "user.email", "os@test"); git("config", "user.name", "os-test");
  fs.writeFileSync(path.join(root, ".env.example"), "DATABASE_URL=\n");
  git("add", "-A"); git("commit", "-qm", "sandbox");
  const run = (script, args = [], env = {}) => spawnSync(process.execPath, [path.join(root, ".claude", "runtime", script), ...args], { cwd: root, encoding: "utf8", env: { ...process.env, DATABASE_URL: "", ...env } });
  return { root, run, git, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
