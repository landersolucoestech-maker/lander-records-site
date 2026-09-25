#!/usr/bin/env node
// dispatch.mjs <role-id> [--finding F-NNNN] [--scope "git range or paths"]
// Prints the complete prompt to launch any registered role (lead, subagent, auditor, reviewer, guardian,
// integration agent) through Claude Code's Agent tool. Files under .claude/agents/ are also discoverable by
// Claude Code directly; every other role is launched with this prompt (general-purpose agent).
import fs from "node:fs";
import crypto from "node:crypto";
import { args, run, OsError, osPath, readJson, writeJson, workspaceFingerprint, nowIso } from "./lib/io.mjs";
import { TICKET_DIR } from "./lib/evidence.mjs";
import { currentMission, missionHash } from "./lib/mission-def.mjs";

run(() => {
  const a = args();
  const id = a._[0];
  const registry = readJson(osPath("control-plane", "registry.json"));
  const entries = Object.entries(registry.components).flatMap(([kind, list]) => list.map((e) => ({ ...e, kind })));
  if (!id || id === "list") { for (const e of entries.filter((x) => !["skills", "workflows", "gates", "sensors"].includes(x.kind))) console.log(`${e.id.padEnd(34)} ${e.kind}`); return; }
  const entry = entries.find((e) => e.id === id && !["skills", "workflows", "gates", "sensors"].includes(e.kind));
  if (!entry) throw new OsError("NOT_FOUND", `unknown role ${id} (dispatch.mjs list)`);
  const body = fs.readFileSync(osPath(entry.path), "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const finding = a.finding ? fs.readFileSync(osPath("findings", `${a.finding}.json`), "utf8") : null;
  const reviewer = entry.kind === "reviewers";
  // Ticket: binds a review report to this role and to the exact workspace being reviewed (evidence.mjs review checks it).
  const nonce = crypto.randomBytes(16).toString("hex");
  const ws = workspaceFingerprint();
  writeJson(`${TICKET_DIR}/${nonce}.json`, { nonce, role: id, fingerprint: ws.fingerprint, head: ws.head, finding: a.finding ?? null, missionHash: missionHash(currentMission()), issuedAt: nowIso() });
  const writer = /tools:.*\bEdit\b/.test(fs.readFileSync(osPath(entry.path), "utf8"));
  console.log(`You are acting as the "${id}" role of the Lander Records Engineering OS (.claude/CLAUDE.md).
Repository: the lander-records-site checkout (single target; ignore any other repository).
Mode: ${writer ? "may edit only the paths this role owns" : "READ-ONLY — do not edit files, do not commit"}.

${body.trim()}
${finding ? `\n## Finding under work\n\`\`\`json\n${finding.trim()}\n\`\`\`\n` : ""}${a.scope ? `\n## Scope\n${a.scope}\n` : ""}
## Output contract
${reviewer ? `List findings (severity, file:line, concrete failure scenario, introduced vs pre-existing). Include this exact line in your answer: \`REVIEW-TICKET: ${nonce}\`. The LAST line of your answer must be exactly \`VERDICT: PASS\` or \`VERDICT: FAIL\`.` : `Report findings using the fields of .claude/contracts/finding.schema.json with file:line evidence; state unknowns as unknown. Ticket: ${nonce}`}
Never claim fixed/healthy/delivered without naming the command you ran and its result.`);
});
