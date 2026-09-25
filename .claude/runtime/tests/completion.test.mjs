// ADR-0007: completion trusts re-execution, not records.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sandbox } from "./helpers.mjs";

function reexecute(box, criteria) {
  const lib = path.join(box.root, ".claude", "runtime", "lib", "completion.mjs");
  const script = `import(${JSON.stringify(lib)}).then((m) => console.log(JSON.stringify(m.reexecuteCriteria(${JSON.stringify(criteria)}))))`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout.trim().split("\n").at(-1));
}

test("vacuous verify and proof commands are rejected", () => {
  const box = sandbox();
  try {
    fs.mkdirSync(path.join(box.root, "tests", "unit"), { recursive: true });
    fs.writeFileSync(path.join(box.root, "tests", "unit", "ok.test.mjs"), "import test from 'node:test'; test('ok', () => {});\n");
    box.git("add", "-A"); box.git("commit", "-qm", "suite");
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.run("mission.mjs", ["start", "--objective", "sandbox"]);
    box.run("mission.mjs", ["requirement", "--text", "r"]);
    for (const verify of ["true", "echo npm test", "node -e 0", "node --test --test-name-pattern=x tests/unit/ok.test.mjs", "node tests/../x.mjs", "npm run test -- --grep nothing"]) {
      assert.match(box.run("mission.mjs", ["criterion", "--requirement", "R-001", "--text", "c", "--verify", verify]).stderr, /NOT_A_VERIFY_COMMAND/, verify);
    }
    for (const argv of [["true", "npm", "test"], ["node", "-e", "0", "node --test"], ["echo", "npm", "test"]]) {
      assert.match(box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", ...argv]).stderr, /NOT_A_PROOF/, argv.join(" "));
    }
    assert.equal(box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", "node", "--test", "tests/unit/ok.test.mjs"]).status, 0);
  } finally { box.cleanup(); }
});

test("a forged PASS record cannot close a criterion whose declared command fails", () => {
  const box = sandbox();
  try {
    fs.mkdirSync(path.join(box.root, "tests", "unit"), { recursive: true });
    fs.writeFileSync(path.join(box.root, "tests", "unit", "fail.test.mjs"), "import test from 'node:test'; import assert from 'node:assert'; test('fails', () => assert.fail('real failure'));\n");
    box.git("add", "-A"); box.git("commit", "-qm", "failing suite");
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.run("mission.mjs", ["start", "--objective", "sandbox"]);
    box.run("mission.mjs", ["requirement", "--text", "r"]);
    const verify = "node --test tests/unit/fail.test.mjs";
    const c = box.run("mission.mjs", ["criterion", "--requirement", "R-001", "--text", "suite", "--verify", verify]).stdout.trim();
    assert.match(c, /^C-\d{3}$/);

    // The threat ADR-0007 assumes: a hand-written PASS record for the criterion.
    const evDir = path.join(box.root, ".claude", "evidence");
    const last = fs.readdirSync(evDir).filter((n) => /^EV-\d{4}\.json$/.test(n)).sort().at(-1);
    const template = JSON.parse(fs.readFileSync(path.join(evDir, last), "utf8"));
    fs.writeFileSync(path.join(evDir, "EV-9998.json"), JSON.stringify({ ...template, id: "EV-9998", criteria: [c], result: "PASS", exitCode: 0, command: verify, argv: verify.split(" ") }, null, 2));

    const [result] = reexecute(box, [{ id: c, verify }]);
    assert.equal(result.ok, false, "re-execution must report the real failure");
    assert.match(result.detail, /FAIL/);
  } finally { box.cleanup(); }
});

test("--no-exec can never produce a verdict better than D", () => {
  const box = sandbox();
  try {
    const out = box.run("completion.mjs", ["--no-exec"]);
    assert.equal(out.status, 1);
    assert.match(out.stdout, /VERDICT D/);
    assert.match(out.stdout, /skipped/);
  } finally { box.cleanup(); }
});
