import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sandbox, OS_SOURCE } from "./helpers.mjs";
import { TRANSITIONS, transition, priorityScore, readyQueue } from "../lib/findings.mjs";
import { validate } from "../lib/schema.mjs";

test("kernel/state-machine.md documents exactly the enforced transition table", () => {
  const doc = fs.readFileSync(path.join(OS_SOURCE, "kernel", "state-machine.md"), "utf8");
  const rows = Object.fromEntries([...doc.matchAll(/^\| ([A-Z_]+) \| ([A-Z_, ]+) \|$/gm)].map((m) => [m[1], m[2].split(",").map((s) => s.trim())]));
  for (const [from, to] of Object.entries(TRANSITIONS)) if (to.length) assert.deepEqual(rows[from], to, from);
});

test("illegal transitions, missing notes and unproven RESOLVED are rejected", () => {
  const finding = JSON.parse(fs.readFileSync(path.join(OS_SOURCE, "templates", "finding.json"), "utf8"));
  const base = { ...finding, id: "F-9999", title: "t", evidence: ["x"], rootCause: "r", producer: ["p"], consumers: ["c"], affectedFlow: "f", invariantViolated: "i", blastRadius: "b", autofix: { eligible: true, reason: "r" }, correction: "c", requiredTests: ["t"], regressionRisk: "r", producerAgent: "a", discoveredAt: "2026-09-25T00:00:00.000Z", history: [{ status: "TRIAGED", at: "2026-09-25T00:00:00.000Z", by: "a", note: "n" }] };
  assert.throws(() => transition(base, "RESOLVED", "a", "skip"), /not allowed/);
  assert.throws(() => transition(base, "READY", "a", ""), /note/);
  const reaudit = { ...base, status: "REAUDITING", history: [...base.history, { status: "REAUDITING", at: "2026-09-25T00:00:00.000Z", by: "a", note: "n" }] };
  assert.throws(() => transition(reaudit, "RESOLVED", "a", "done"), /invalid finding/);
  assert.equal(transition(reaudit, "RESOLVED", "a", "done", { evidenceRecords: ["EV-0001"] }).status, "RESOLVED");
});

test("priority engine orders by severity/domain/confidence and excludes blocked work", () => {
  const f = (id, severity, domain, extra = {}) => ({ id, severity, domain, confidence: "high", risk: "low", status: "READY", dependencies: [], ...extra });
  const all = [f("F-0003", "P2", "seo"), f("F-0001", "P1", "leads"), f("F-0002", "P1", "security"), f("F-0004", "P0", "seo", { dependencies: ["DEC-0001"] })];
  assert.ok(priorityScore(all[2]) > priorityScore(all[1]));
  assert.deepEqual(readyQueue(all).map((x) => x.id), ["F-0002", "F-0001", "F-0003"]);
});

test("schema validator rejects unsupported keywords instead of ignoring them", () => {
  assert.match(validate({ type: "object", oneOf: [] }, {}).join(), /unsupported schema keyword "oneOf"/);
  assert.deepEqual(validate({ type: "string", format: "uuid" }, "2c1d0a0e-1111-4111-8111-111111111111"), []);
});

test("evidence cannot be asserted and records the real exit code", () => {
  const box = sandbox();
  try {
    const asserted = box.run("evidence.mjs", ["run", "--result", "PASS", "--", "node", "-e", "0"]);
    assert.notEqual(asserted.status, 0);
    assert.match(asserted.stderr, /POLICY_BLOCKED/);
    const failing = box.run("evidence.mjs", ["run", "--summary", "must fail", "--", process.execPath, "-e", "process.exit(3)"]);
    assert.equal(failing.status, 1);
    const record = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", "EV-0001.json"), "utf8"));
    assert.equal(record.result, "FAIL");
    assert.equal(record.exitCode, 3);
    assert.match(record.fingerprint, /^[0-9a-f]{64}$/);
  } finally { box.cleanup(); }
});

test("workspace fingerprint ignores OS records and commits, but tracks product changes", () => {
  const box = sandbox();
  try {
    const fp = () => JSON.parse(box.run("controller.mjs", ["status"]).stdout).workspace;
    const probe = () => box.run("evidence.mjs", ["run", "--", process.execPath, "-e", "0"]);
    probe();
    const first = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", "EV-0001.json"), "utf8")).fingerprint;
    box.git("add", "-A"); box.git("commit", "-qm", "record evidence");
    probe();
    const afterCommit = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", "EV-0002.json"), "utf8")).fingerprint;
    assert.equal(afterCommit, first, "committing records must not change the fingerprint");
    fs.writeFileSync(path.join(box.root, "product.ts"), "export const x = 1;\n");
    probe();
    const afterChange = JSON.parse(fs.readFileSync(path.join(box.root, ".claude", "evidence", "EV-0003.json"), "utf8")).fingerprint;
    assert.notEqual(afterChange, first, "product changes must change the fingerprint");
    void fp;
  } finally { box.cleanup(); }
});
