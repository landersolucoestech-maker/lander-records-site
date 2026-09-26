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

function anchorErrors(box) {
  const lib = path.join(box.root, ".claude", "runtime", "lib", "mission-def.mjs");
  const script = `import(${JSON.stringify(lib)}).then((m) => console.log(JSON.stringify(m.missionAnchorErrors(m.currentMission()))))`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout.trim().split("\n").at(-1));
}
function editMission(box, fn) {
  const file = path.join(box.root, ".claude", "state", "mission.yml");
  const text = fs.readFileSync(file, "utf8");
  const header = text.split("\n").filter((l) => l.startsWith("#")).join("\n");
  const state = JSON.parse(text.split("\n").filter((l) => !l.startsWith("#")).join("\n"));
  fn(state.current);
  fs.writeFileSync(file, `${header}\n${JSON.stringify(state, null, 2)}\n`);
}

test("a committed mission definition cannot be weakened by a later commit", () => {
  const box = sandbox();
  try {
    fs.mkdirSync(path.join(box.root, "tests", "unit"), { recursive: true });
    fs.writeFileSync(path.join(box.root, "tests", "unit", "ok.test.mjs"), "import test from 'node:test'; test('ok', () => {});\n");
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.run("mission.mjs", ["start", "--objective", "sandbox"]);
    box.run("mission.mjs", ["requirement", "--text", "r"]);
    box.run("mission.mjs", ["criterion", "--requirement", "R-001", "--text", "c", "--verify", "node --test tests/unit/ok.test.mjs"]);
    assert.match(anchorErrors(box).join(";"), /never committed/);
    box.git("add", "-A"); box.git("commit", "-qm", "anchor mission");
    assert.deepEqual(anchorErrors(box), []);

    // Uncommitted weakening is caught against HEAD; committed weakening against the first anchor.
    editMission(box, (m) => { m.requirements[0].criteria[0].verify = "npm run lint"; });
    assert.match(anchorErrors(box).join(";"), /differs from HEAD/);
    box.git("add", "-A"); box.git("commit", "-qm", "weaken");
    assert.match(anchorErrors(box).join(";"), /criterion C-001 changed or removed/);

    editMission(box, (m) => { m.requirements[0].criteria[0].verify = "node --test tests/unit/ok.test.mjs"; m.requirements.splice(0, 1); });
    box.git("add", "-A"); box.git("commit", "-qm", "drop requirement");
    assert.match(anchorErrors(box).join(";"), /requirement R-001 changed or removed/);

    editMission(box, (m) => { m.startedAt = new Date(Date.now() + 86_400_000).toISOString(); });
    box.git("add", "-A"); box.git("commit", "-qm", "move start");
    assert.match(anchorErrors(box).join(";"), /startedAt differs/);
  } finally { box.cleanup(); }
});

test("environment overrides and runs that execute no tests never yield PASS", () => {
  const box = sandbox();
  try {
    fs.mkdirSync(path.join(box.root, "tests", "unit"), { recursive: true });
    fs.writeFileSync(path.join(box.root, "tests", "unit", "empty.test.mjs"), "// no tests\n");
    box.git("add", "-A"); box.git("commit", "-qm", "empty suite");
    for (const argv of [
      ["env", "NODE_OPTIONS=--require=/dev/null", "node", "--test", "tests/unit/empty.test.mjs"],
      ["env", "NODE_TEST_CONTEXT=child", "node", "--test", "tests/unit/empty.test.mjs"],
      ["env", "-i", "node", "--test", "tests/unit/empty.test.mjs"],
      ["env", "npm_config_script_shell=/bin/true", "npm", "test"],
    ]) assert.match(box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", ...argv]).stderr, /NOT_A_PROOF/, argv.join(" "));
    const out = box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", "node", "--test", "tests/unit/empty.test.mjs"]);
    assert.match(out.stdout + out.stderr, /FAIL/, "a suite that ran zero tests must be FAIL");
    fs.writeFileSync(path.join(box.root, "tests", "unit", "skipped.test.mjs"), "import test from 'node:test'; test.skip('s', () => {}); test('t', { todo: true }, () => {});\n");
    box.git("add", "-A"); box.git("commit", "-qm", "skipped suite");
    const skipped = box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", "node", "--test", "tests/unit/skipped.test.mjs"]);
    assert.match(skipped.stdout + skipped.stderr, /FAIL/, "a suite whose tests were all skipped/todo must be FAIL");
  } finally { box.cleanup(); }
});

function scope(box) {
  const lib = path.join(box.root, ".claude", "runtime", "lib", "mission-def.mjs");
  const findingsLib = path.join(box.root, ".claude", "runtime", "lib", "findings.mjs");
  const script = `Promise.all([import(${JSON.stringify(lib)}), import(${JSON.stringify(findingsLib)})]).then(([m, f]) => console.log(JSON.stringify([...m.missionFindingIds(m.currentMission(), f.loadFindings())].sort())))`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout.trim().split("\n").at(-1));
}

test("abort + restart cannot shrink the finding scope; only a successful close resets it", () => {
  const box = sandbox();
  try {
    const all = fs.readdirSync(path.join(box.root, ".claude", "findings")).filter((n) => /^F-\d{4}\.json$/.test(n)).map((n) => n.slice(0, 6)).sort();
    assert.ok(all.length > 0);
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.git("add", "-A"); box.git("commit", "-qm", "abort");
    box.run("mission.mjs", ["start", "--objective", "fresh"]);
    box.git("add", "-A"); box.git("commit", "-qm", "restart");
    assert.deepEqual(scope(box), all, "with no successful close, every finding is in scope");

    // A successfully closed mission becomes the base: afterwards only findings changed since then are in scope.
    editMission(box, () => {});
    const file = path.join(box.root, ".claude", "state", "mission.yml");
    const text = fs.readFileSync(file, "utf8");
    const header = text.split("\n").filter((l) => l.startsWith("#")).join("\n");
    const state = JSON.parse(text.split("\n").filter((l) => !l.startsWith("#")).join("\n"));
    state.history.push({ ...state.current, status: "COMPLETED", verdict: "C", closedAt: new Date().toISOString() });
    state.current = null;
    fs.writeFileSync(file, `${header}\n${JSON.stringify(state, null, 2)}\n`);
    box.git("add", "-A"); box.git("commit", "-qm", "close");
    box.run("mission.mjs", ["start", "--objective", "next"]);
    box.git("add", "-A"); box.git("commit", "-qm", "next");
    assert.deepEqual(scope(box), []);
    const f = path.join(box.root, ".claude", "findings", `${all[0]}.json`);
    fs.appendFileSync(f, "\n");
    box.git("add", "-A"); box.git("commit", "-qm", "touch finding");
    assert.deepEqual(scope(box), [all[0]]);
    // Aborting again does not move the base.
    box.run("mission.mjs", ["abort", "--note", "again"]);
    box.run("mission.mjs", ["start", "--objective", "again"]);
    box.git("add", "-A"); box.git("commit", "-qm", "restart again");
    assert.deepEqual(scope(box), [all[0]]);
  } finally { box.cleanup(); }
});

test("a user npmrc cannot turn a failing npm suite into PASS", () => {
  const box = sandbox();
  const home = fs.mkdtempSync(path.join(box.root, "..", "lander-home-"));
  try {
    fs.mkdirSync(path.join(box.root, "tests", "unit"), { recursive: true });
    fs.writeFileSync(path.join(box.root, "tests", "unit", "fail.test.mjs"), "import test from 'node:test'; import assert from 'node:assert'; test('fails', () => assert.fail('x'));\n");
    fs.writeFileSync(path.join(box.root, "package.json"), JSON.stringify({ name: "sandbox", private: true, scripts: { test: "node --test tests/unit/fail.test.mjs" } }));
    fs.writeFileSync(path.join(home, ".npmrc"), "script-shell=/bin/true\n");
    box.git("add", "-A"); box.git("commit", "-qm", "failing npm suite");
    const out = box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", "npm", "test"], { HOME: home });
    assert.match(out.stdout + out.stderr, /FAIL/, out.stdout + out.stderr);
  } finally { box.cleanup(); fs.rmSync(home, { recursive: true, force: true }); }
});

test("requiredTests binding and ticket mission binding", () => {
  const box = sandbox();
  try {
    const lib = path.join(box.root, ".claude", "runtime", "lib", "findings.mjs");
    const script = `import(${JSON.stringify(lib)}).then((m) => console.log(JSON.stringify([
      m.matchesRequiredTests({ requiredTests: ["tests/unit/a.test.mjs"] }, { command: "node --test tests/unit/a.test.mjs" }),
      m.matchesRequiredTests({ requiredTests: ["tests/unit/a.test.mjs"] }, { command: "node --test tests/unit/b.test.mjs" }),
      m.matchesRequiredTests({ requiredTests: ["npm run test:claude-os"] }, { command: "npm run test:unit" }),
      m.matchesRequiredTests({ requiredTests: ["tests/integration/x.mjs"] }, { argv: ["env", "DATABASE_URL=tests/integration/x.mjs", "node", "--test", "tests/unit/y.test.mjs"] }),
      m.matchesRequiredTests({ requiredTests: [] }, { command: "npm test" }),
      m.matchesRequiredTests({ requiredTests: ["tests/integration/x.mjs"] }, { argv: ["env", "DATABASE_URL=postgres://h/db_test", "node", "tests/integration/x.mjs"] }),
    ])))`;
    const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr);
    assert.deepEqual(JSON.parse(out.stdout.trim()), [true, false, false, false, false, true], "env values never satisfy requiredTests; an empty list fails closed");

    // A review dispatched for one mission definition cannot be recorded after the definition changes.
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.run("mission.mjs", ["start", "--objective", "sandbox"]);
    box.run("mission.mjs", ["requirement", "--text", "r"]);
    const prompt = box.run("dispatch.mjs", ["adversarial-reviewer"]).stdout;
    const ticket = prompt.match(/REVIEW-TICKET: ([0-9a-f]{32})/)[1];
    box.run("mission.mjs", ["requirement", "--text", "r2"]);
    const report = path.join(box.root, "report.md");
    fs.writeFileSync(report, `REVIEW-TICKET: ${ticket}\n\nVERDICT: PASS\n`);
    const rec = box.run("evidence.mjs", ["review", "--reviewer", "adversarial-reviewer", "--verdict", "PASS", "--report", report]);
    assert.notEqual(rec.status, 0);
    assert.match(rec.stdout + rec.stderr, /TICKET_STALE|mission definition changed/);
  } finally { box.cleanup(); }
});

test("committed records stay anchored across later commits (not only against HEAD)", () => {
  const box = sandbox();
  try {
    const findingsDir = path.join(box.root, ".claude", "findings");
    const file = fs.readdirSync(findingsDir).filter((n) => /^F-\d{4}\.json$/.test(n)).sort()[0];
    const full = path.join(findingsDir, file);
    const validate = () => { const out = box.run("pack.mjs", []); return out.stdout + out.stderr; };
    assert.match(validate(), /PACK_VALID=PASS/);
    const f = JSON.parse(fs.readFileSync(full, "utf8"));
    f.history = f.history.slice(0, 1);
    fs.writeFileSync(full, JSON.stringify(f, null, 2));
    box.git("add", "-A"); box.git("commit", "-qm", "truncate history");
    fs.writeFileSync(path.join(box.root, "unrelated.txt"), "x\n");
    box.git("add", "-A"); box.git("commit", "-qm", "later commit");
    assert.match(validate(), /committed history was rewritten/);

    // Each file reports its first violation; use another finding for the requiredTests case.
    const other = path.join(findingsDir, fs.readdirSync(findingsDir).filter((n) => /^F-\d{4}\.json$/.test(n)).sort()[1]);
    const g = JSON.parse(fs.readFileSync(other, "utf8"));
    g.requiredTests = [];
    fs.writeFileSync(other, JSON.stringify(g, null, 2));
    box.git("add", "-A"); box.git("commit", "-qm", "drop required tests");
    assert.match(validate(), /requiredTests entries removed/);
  } finally { box.cleanup(); }
});

test("closed-mission history is append-only (an ABORTED mission cannot become COMPLETED)", () => {
  const box = sandbox();
  try {
    box.run("mission.mjs", ["abort", "--note", "sandbox"]);
    box.git("add", "-A"); box.git("commit", "-qm", "abort");
    const file = path.join(box.root, ".claude", "state", "mission.yml");
    const text = fs.readFileSync(file, "utf8");
    const header = text.split("\n").filter((l) => l.startsWith("#")).join("\n");
    const state = JSON.parse(text.split("\n").filter((l) => !l.startsWith("#")).join("\n"));
    state.history.at(-1).status = "COMPLETED";
    state.history.at(-1).verdict = "A";
    fs.writeFileSync(file, `${header}\n${JSON.stringify(state, null, 2)}\n`);
    box.git("add", "-A"); box.git("commit", "-qm", "rewrite");
    const out = box.run("pack.mjs", []);
    assert.match(out.stdout + out.stderr, /committed mission history was rewritten/);
  } finally { box.cleanup(); }
});

test("npm proofs refuse to run under a project .npmrc; verification needs every requiredTests suite", () => {
  const box = sandbox();
  try {
    fs.writeFileSync(path.join(box.root, "package.json"), JSON.stringify({ name: "sandbox", private: true, scripts: { test: "node --test" } }));
    fs.writeFileSync(path.join(box.root, ".npmrc"), "node-options=--require /dev/null\n");
    box.git("add", "-A"); box.git("commit", "-qm", "npmrc");
    assert.match(box.run("evidence.mjs", ["run", "--finding", "F-0001", "--", "npm", "test"]).stderr, /NPMRC_PRESENT/);

    const lib = path.join(box.root, ".claude", "runtime", "lib", "findings.mjs");
    const finding = { requiredTests: ["tests/unit/a.test.mjs", "tests/integration/b.mjs"] };
    const script = `import(${JSON.stringify(lib)}).then((m) => console.log(JSON.stringify([
      m.missingRequiredTests(${JSON.stringify(finding)}, [{ argv: ["node", "--test", "tests/unit/a.test.mjs"] }]),
      m.missingRequiredTests(${JSON.stringify(finding)}, [{ argv: ["node", "--test", "tests/unit/a.test.mjs"] }, { argv: ["node", "tests/integration/b.mjs"] }]),
      m.missingRequiredTests({ requiredTests: [...${JSON.stringify(finding.requiredTests)}, "npm run test:claude-os"] }, [{ argv: ["npm", "run", "test:claude-os"] }]),
    ])))`;
    const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr);
    const [one, both, widened] = JSON.parse(out.stdout.trim());
    assert.deepEqual(one, ["tests/integration/b.mjs"]);
    assert.deepEqual(both, []);
    assert.deepEqual(widened, ["tests/unit/a.test.mjs", "tests/integration/b.mjs"], "appending a suite never replaces the original ones");
  } finally { box.cleanup(); }
});
