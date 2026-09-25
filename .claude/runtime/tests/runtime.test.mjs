import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sandbox, OS_SOURCE } from "./helpers.mjs";
import { TRANSITIONS, priorityScore, readyQueue, validateFinding } from "../lib/findings.mjs";
import { validate } from "../lib/schema.mjs";
import { reportVerdict, verifyChain, recordHash } from "../lib/evidence.mjs";

const evId = (result) => result.stdout.match(/^(EV-\d{4}) /m)?.[1];
const draft = (overrides = {}) => ({ title: "sandbox defect", severity: "P2", domain: "backend", status: "DISCOVERED", confidence: "high", evidence: ["x:1"], rootCause: "r", producer: ["p"], consumers: ["c"], affectedFlow: "f", invariantViolated: "i", blastRadius: "b", dependencies: [], autofix: { eligible: true, reason: "r" }, risk: "low", correction: "c", requiredTests: ["t"], regressionRisk: "r", impactLevel: "L2", producerAgent: "test", ...overrides });

test("kernel/state-machine.md documents exactly the enforced transition table", () => {
  const doc = fs.readFileSync(path.join(OS_SOURCE, "kernel", "state-machine.md"), "utf8");
  const rows = Object.fromEntries([...doc.matchAll(/^\| ([A-Z_]+) \| ([A-Z_, ]+) \|$/gm)].map((m) => [m[1], m[2].split(",").map((s) => s.trim())]));
  for (const [from, to] of Object.entries(TRANSITIONS)) if (to.length) assert.deepEqual(rows[from], to, from);
});

test("history replay rejects hand-edited jumps and non-DISCOVERED starts", () => {
  const at = (s) => `2026-09-25T00:00:0${s}.000Z`;
  const base = { ...draft(), id: "F-9999", discoveredAt: at(0) };
  const jump = { ...base, status: "RESOLVED", evidenceRecords: [], history: [{ status: "DISCOVERED", at: at(0), by: "a", note: "n" }, { status: "RESOLVED", at: at(1), by: "a", note: "n" }] };
  assert.ok(validateFinding(jump, []).some((e) => /illegal transition in history DISCOVERED -> RESOLVED/.test(e)));
  const lateStart = { ...base, status: "TRIAGED", history: [{ status: "TRIAGED", at: at(0), by: "a", note: "n" }] };
  assert.ok(validateFinding(lateStart, []).some((e) => /must start at DISCOVERED/.test(e)));
});

test("priority engine orders by severity/domain/confidence and excludes open decisions", () => {
  const f = (id, severity, domain, extra = {}) => ({ id, severity, domain, confidence: "high", risk: "low", status: "READY", dependencies: [], ...extra });
  const all = [f("F-0003", "P2", "seo"), f("F-0001", "P1", "leads"), f("F-0002", "P1", "security"), f("F-0004", "P0", "seo", { dependencies: ["DEC-0001"] })];
  assert.ok(priorityScore(all[2]) > priorityScore(all[1]));
  assert.deepEqual(readyQueue(all).map((x) => x.id), ["F-0002", "F-0001", "F-0003"]);
});

test("schema validator rejects unsupported keywords instead of ignoring them", () => {
  assert.match(validate({ type: "object", oneOf: [] }, {}).join(), /unsupported schema keyword "oneOf"/);
});

test("review verdict is the last non-empty line only", () => {
  assert.equal(reportVerdict("End with `VERDICT: PASS` or `VERDICT: FAIL`.\nfindings...\nVERDICT: FAIL\n"), "FAIL");
  assert.equal(reportVerdict("quote: VERDICT: PASS\nmore text"), null);
});

test("evidence: no asserted results, real exit codes, known criteria only, tamper-evident chain", () => {
  const box = sandbox();
  try {
    assert.match(box.run("evidence.mjs", ["run", "--result", "PASS", "--", "node", "-e", "0"]).stderr, /POLICY_BLOCKED/);
    const failing = box.run("evidence.mjs", ["run", "--", process.execPath, "-e", "process.exit(3)"]);
    assert.equal(failing.status, 1);
    const record = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", `${evId(failing)}.json`), "utf8"));
    assert.equal(record.result, "FAIL");
    assert.equal(record.exitCode, 3);
    assert.match(box.run("evidence.mjs", ["run", "--criterion", "C-999", "--", process.execPath, "-e", "0"]).stderr, /UNKNOWN_CRITERION/);
    const file = path.join(box.root, ".claude", "evidence", `${evId(failing)}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...record, result: "PASS", exitCode: 0 }, null, 2));
    assert.match(box.run("pack.mjs").stderr, /edited after recording/);
  } finally { box.cleanup(); }
  assert.deepEqual(verifyChain([]), []);
  const r = { id: "EV-0001", prevHash: "GENESIS", a: 1 };
  assert.deepEqual(verifyChain([{ ...r, hash: recordHash(r) }]), []);
});

test("fingerprint ignores OS records and commits, but tracks product changes", () => {
  const box = sandbox();
  try {
    const fp = () => {
      const out = box.run("evidence.mjs", ["run", "--", process.execPath, "-e", "0"]);
      return JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", `${evId(out)}.json`), "utf8")).fingerprint;
    };
    const first = fp();
    box.git("add", "-A"); box.git("commit", "-qm", "record evidence");
    assert.equal(fp(), first);
    fs.writeFileSync(path.join(box.root, "product.ts"), "export const x = 1;\n");
    assert.notEqual(fp(), first);
  } finally { box.cleanup(); }
});

test("lifecycle: proof must name the finding; mission close never takes a caller verdict; sensors reopen regressions", () => {
  const box = sandbox();
  try {
    const d = path.join(box.root, "draft.json");
    fs.writeFileSync(d, JSON.stringify(draft({ status: "RESOLVED" })));
    const id = box.run("findings.mjs", ["create", "--file", d]).stdout.trim();
    const created = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "findings", `${id}.json`), "utf8"));
    assert.equal(created.status, "DISCOVERED", "create always starts at DISCOVERED");
    const step = (to, extra = []) => box.run("findings.mjs", ["transition", id, "--to", to, "--note", "n", ...extra]);
    for (const to of ["TRIAGED", "READY", "INVESTIGATING", "ROOT_CAUSE_CONFIRMED", "FIXING", "VALIDATING"]) assert.equal(step(to).status, 0, to);
    const unrelated = evId(box.run("evidence.mjs", ["run", "--", process.execPath, "-e", "0"]));
    assert.match(step("REAUDITING", ["--evidence", unrelated]).stderr, /PROOF_REQUIRED/);
    const proof = evId(box.run("evidence.mjs", ["run", "--finding", id, "--", process.execPath, "-e", "0"]));
    assert.equal(step("REAUDITING", ["--evidence", proof]).status, 0);
    assert.equal(step("RESOLVED", ["--evidence", proof]).status, 0);

    // A sensor whose signal matches a RESOLVED finding reopens it.
    const sensor = { id: "sandbox-sensor", title: "sandbox", kind: "check", domain: "backend", feeds: "f", invariant: "i", severity: "P2", check: { type: "required-pattern", file: "missing.txt", pattern: "x", message: "m" } };
    fs.writeFileSync(path.join(box.root, ".claude", "sensors", "sandbox-sensor.json"), JSON.stringify(sensor));
    const first = box.run("sensors.mjs", ["run", "--only", "sandbox-sensor", "--emit-findings"]);
    const signalFinding = first.stdout.match(/-> (F-\d{4}) DISCOVERED/)[1];
    const f = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "findings", `${signalFinding}.json`), "utf8"));
    const again = box.run("sensors.mjs", ["run", "--only", "sandbox-sensor", "--emit-findings"]);
    assert.doesNotMatch(again.stdout, /-> F-\d{4}/, "an open finding is not duplicated");
    for (const to of ["TRIAGED", "READY", "INVESTIGATING", "ROOT_CAUSE_CONFIRMED", "FIXING", "VALIDATING"]) box.run("findings.mjs", ["transition", signalFinding, "--to", to, "--note", "n"]);
    const p2 = evId(box.run("evidence.mjs", ["run", "--finding", signalFinding, "--", process.execPath, "-e", "0"]));
    box.run("findings.mjs", ["transition", signalFinding, "--to", "REAUDITING", "--note", "n", "--evidence", p2]);
    assert.equal(box.run("findings.mjs", ["transition", signalFinding, "--to", "RESOLVED", "--note", "n", "--evidence", p2]).status, 0);
    const regression = box.run("sensors.mjs", ["run", "--only", "sandbox-sensor", "--emit-findings"]);
    assert.match(regression.stdout, new RegExp(`${signalFinding} \\(reopened\\)`));
    void f;

    assert.match(box.run("mission.mjs", ["close", "--verdict", "A"]).stderr, /POLICY_BLOCKED/);
    assert.match(box.run("mission.mjs", ["close"]).stderr, /COMPLETION_FAILED/);
  } finally { box.cleanup(); }
});

test("a decided DEC unblocks its findings; an open DEC keeps them parked", () => {
  const box = sandbox();
  try {
    const decision = fs.readdirSync(path.join(box.root, ".claude", "decisions")).find((n) => n.startsWith("DEC-0005"));
    const blocked = box.run("findings.mjs", ["transition", "F-0014", "--to", "READY", "--note", "n"]);
    assert.match(blocked.stderr, /DECISION_OPEN/);
    const file = path.join(box.root, ".claude", "decisions", decision);
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("- Status: OPEN", "- Status: DECIDED"));
    assert.equal(box.run("findings.mjs", ["transition", "F-0014", "--to", "READY", "--note", "decided A"]).status, 0);
    assert.match(box.run("findings.mjs", ["ready"]).stdout, /F-0014/);
  } finally { box.cleanup(); }
});
