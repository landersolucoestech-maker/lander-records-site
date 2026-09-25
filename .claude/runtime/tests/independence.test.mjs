// ADR-0005: the OS must run with nothing but .claude/ — no other pack, no shared runtime, no node_modules.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sandbox, OS_SOURCE } from "./helpers.mjs";
import { walk } from "../lib/io.mjs";
import { NON_OPERATIONAL, isRecordPath } from "../lib/pack.mjs";

const FORBIDDEN = /\.codex|codex/i;

test("no operational reference to the out-of-architecture Codex pack", () => {
  const offenders = walk(OS_SOURCE).map((f) => path.relative(OS_SOURCE, f).split(path.sep).join("/")).filter((r) => !NON_OPERATIONAL.has(r) && !isRecordPath(r) && FORBIDDEN.test(fs.readFileSync(path.join(OS_SOURCE, r), "utf8")));
  assert.deepEqual(offenders, []);
  assert.match(fs.readFileSync(path.join(OS_SOURCE, "decisions", "ADR-0001-claude-codex-boundary.md"), "utf8"), /SUPERSEDED — NON-OPERATIONAL/);
});

test("runtime imports only Node built-ins and its own modules", () => {
  for (const file of walk(path.join(OS_SOURCE, "runtime"), (f) => f.endsWith(".mjs"))) {
    for (const [, spec] of fs.readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      assert.ok(spec.startsWith("node:") || spec.startsWith("."), `${path.relative(OS_SOURCE, file)} imports ${spec}`);
    }
  }
});

test("the OS runs in a repository that contains only .claude/", () => {
  const box = sandbox();
  try {
    assert.equal(fs.existsSync(path.join(box.root, ".codex")), false);
    assert.equal(fs.existsSync(path.join(box.root, "node_modules")), false);
    for (const [script, args] of [["pack.mjs", []], ["findings.mjs", ["validate"]], ["controller.mjs", ["next"]], ["controller.mjs", ["status"]], ["preflight.mjs", []], ["mission.mjs", ["status"]], ["gate.mjs", ["list"]]]) {
      const result = box.run(script, args);
      assert.equal(result.status, 0, `${script} ${args.join(" ")}: ${result.stderr}`);
    }
    const sensors = box.run("sensors.mjs", ["run", "--only", "lead-delivery,env-contract"]);
    assert.equal(sensors.status, 0, sensors.stderr);
    assert.match(sensors.stdout, /\[BLOCKED\] lead-delivery — DATABASE_URL not set/);
  } finally { box.cleanup(); }
});
