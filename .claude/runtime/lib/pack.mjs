// Pack integrity validation (control-plane/capability-registry.md). Pure checks, no side effects.
import fs from "node:fs";
import path from "node:path";
import { OS_DIR, osPath, readJson, readYml, walk } from "./io.mjs";
import { validate } from "./schema.mjs";
import { loadFindings, validateFinding, buildIndex, buildDecisions } from "./findings.mjs";
import { loadEvidence, verifyChain } from "./evidence.mjs";
import { REPO_ROOT, git, catFiles } from "./io.mjs";

export const CANONICAL = ["CLAUDE.md", "kernel", "control-plane", "agents", "subagents", "integrations", "leads", "identity", "auditors", "reviewers", "guardians", "contracts", "policies", "rules", "skills", "workflows", "gates", "sensors", "runtime", "state", "findings", "evidence", "knowledge", "graphs", "schemas", "decisions", "incidents", "reports", "templates"];
// Claude Code native configuration files (ADR-0006).
const ALLOWED_EXTRA = new Set([".gitignore", "settings.json", "settings.local.json"]);
const SKILL_SECTIONS = ["INPUT", "PRECONDITIONS", "PROCEDURE", "OUTPUT", "FAILURE MODES", "EVIDENCE REQUIRED", "NEXT ACTION"];
const LEAD_SECTIONS = ["Purpose", "Responsibilities", "Allowed actions", "Prohibited actions", "Required inputs", "Required context", "Procedures", "Outputs", "Evidence requirements", "Handoff rules", "Escalation rules", "Completion rules"];
const PROVIDER_FILES = ["agent.md", "auditor.md", "contract.md", "rules.md", "health.md", "workflow.md"];
const CHECK_TYPES = new Set(["command", "forbidden-pattern", "required-pattern", "no-open-findings", "resolved-have-fresh-evidence", "git-clean-except", "fresh-evidence-for", "preview-workflow-safety"]);
const SENSOR_KINDS = new Set(["sql", "env-contract", "env-presence", "git", "check"]);
const SCHEMA_KEYWORDS = new Set(["$schema", "$id", "title", "description", "type", "enum", "const", "required", "properties", "additionalProperties", "items", "minItems", "minLength", "maxLength", "pattern", "minimum", "format"]);
// Files allowed to mention the out-of-architecture Codex pack, all non-operational (ADR-0005). Single source for pack.mjs and tests.
// Record directories hold data about runs (command output, reports), never configuration or code; scanning
// them made the OS fail on its own test output. Independence is enforced on everything else.
export const RECORD_DIRS = ["state/", "evidence/", "findings/", "reports/"];
export const isRecordPath = (r) => RECORD_DIRS.some((d) => r.startsWith(d));
export const NON_OPERATIONAL = new Set(["decisions/ADR-0001-claude-codex-boundary.md", "decisions/ADR-0005-self-contained-claude-os.md", "runtime/tests/independence.test.mjs", "runtime/lib/pack.mjs"]);

/** Top-level keys of the zod payloadSchema in app/api/contact/route.ts. */
export function contactZodKeys() {
  const file = path.join(REPO_ROOT, "app", "api", "contact", "route.ts");
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const block = text.slice(text.indexOf("const payloadSchema = z.object({"), text.indexOf("\n});", text.indexOf("const payloadSchema")));
  return [...block.matchAll(/^  (\w+): z\./gm)].map((m) => m[1]).sort();
}

export function frontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return Object.fromEntries(match[1].split("\n").map((line) => line.match(/^([a-zA-Z-]+):\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}

function schemaKeywordErrors(schema, at) {
  if (!schema || typeof schema !== "object") return [];
  const errors = Object.keys(schema).filter((k) => !SCHEMA_KEYWORDS.has(k)).map((k) => `${at}: unsupported keyword ${k}`);
  for (const child of Object.values(schema.properties || {})) errors.push(...schemaKeywordErrors(child, `${at}.properties`));
  if (schema.items) errors.push(...schemaKeywordErrors(schema.items, `${at}.items`));
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") errors.push(...schemaKeywordErrors(schema.additionalProperties, `${at}.additionalProperties`));
  return errors;
}

export function validatePack() {
  const errors = [];
  const osRel = (file) => path.relative(OS_DIR, file).split(path.sep).join("/");
  const top = fs.readdirSync(OS_DIR);
  for (const entry of CANONICAL) if (!top.includes(entry)) errors.push(`canonical entry missing: ${entry}`);
  for (const entry of top) if (!CANONICAL.includes(entry) && !ALLOWED_EXTRA.has(entry)) errors.push(`non-canonical top-level entry (requires ADR): ${entry}`);

  const all = walk(OS_DIR);
  for (const file of all) {
    const r = osRel(file);
    const text = fs.readFileSync(file, "utf8");
    if (/\.codex|codex/i.test(text) && !NON_OPERATIONAL.has(r) && !isRecordPath(r)) errors.push(`independence: ${r} references the out-of-architecture Codex pack`);
    if (r.endsWith(".yml")) { try { readYml(file); } catch (error) { errors.push(error.message); } }
    if (r.endsWith(".json")) { try { JSON.parse(text); } catch (error) { errors.push(`${r}: invalid JSON ${error.message}`); } }
  }

  for (const file of walk(osPath("contracts"), (f) => f.endsWith(".schema.json"))) errors.push(...schemaKeywordErrors(readJson(file), osRel(file)));

  const registry = readJson(osPath("control-plane", "registry.json"));
  const registered = new Set();
  for (const [kind, entries] of Object.entries(registry.components)) {
    for (const entry of entries) {
      registered.add(entry.path);
      if (!fs.existsSync(osPath(entry.path))) errors.push(`registry ${kind}: ${entry.id} -> missing ${entry.path}`);
    }
  }
  const mustRegister = [
    ...walk(osPath("agents"), (f) => f.endsWith(".md")), ...walk(osPath("subagents"), (f) => f.endsWith(".md")),
    ...walk(osPath("auditors"), (f) => f.endsWith(".md")), ...walk(osPath("reviewers"), (f) => f.endsWith(".md")),
    ...walk(osPath("guardians"), (f) => f.endsWith(".md")), ...walk(osPath("skills"), (f) => f.endsWith("SKILL.md")),
    ...walk(osPath("workflows"), (f) => f.endsWith(".yml")), ...walk(osPath("gates"), (f) => f.endsWith(".json")), ...walk(osPath("sensors"), (f) => f.endsWith(".json")),
  ].map(osRel).filter((r) => !r.endsWith("README.md"));
  for (const r of mustRegister) if (!registered.has(r)) errors.push(`unregistered component: ${r}`);

  const agentIds = new Set(["agents", "subagents", "auditors", "reviewers", "guardians", "integrationAgents"].flatMap((k) => (registry.components[k] || []).map((e) => e.id)));
  for (const kind of ["agents", "subagents", "auditors", "reviewers", "guardians"]) {
    for (const entry of registry.components[kind] || []) {
      const file = osPath(entry.path);
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      const meta = frontMatter(text);
      if (!meta?.name || !meta.description || !meta.tools) errors.push(`${entry.path}: Claude Code front matter needs name, description, tools`);
      else if (meta.name !== entry.id) errors.push(`${entry.path}: front matter name ${meta.name} != registry id ${entry.id}`);
      if (kind === "agents") for (const section of LEAD_SECTIONS) if (!text.includes(`## ${section}`)) errors.push(`${entry.path}: missing section "${section}"`);
    }
  }
  const skillIds = new Set();
  for (const entry of registry.components.skills || []) {
    skillIds.add(entry.id);
    const file = osPath(entry.path);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const meta = frontMatter(text);
    if (!meta?.name || !meta.description) errors.push(`${entry.path}: skill front matter needs name and description`);
    for (const section of SKILL_SECTIONS) if (!text.includes(`## ${section}`)) errors.push(`${entry.path}: missing section "${section}"`);
  }
  const gateIds = new Set((registry.components.gates || []).map((e) => e.id));
  for (const entry of registry.components.gates || []) {
    if (!fs.existsSync(osPath(entry.path))) continue;
    const gate = readJson(osPath(entry.path));
    if (gate.id !== entry.id) errors.push(`${entry.path}: id mismatch`);
    for (const check of gate.checks || []) if (!CHECK_TYPES.has(check.type)) errors.push(`${entry.path}: unknown check type ${check.type}`);
    if (!gate.checks?.length) errors.push(`${entry.path}: gate without checks`);
  }
  for (const entry of registry.components.sensors || []) {
    if (!fs.existsSync(osPath(entry.path))) continue;
    const sensor = readJson(osPath(entry.path));
    if (!SENSOR_KINDS.has(sensor.kind)) errors.push(`${entry.path}: unknown sensor kind ${sensor.kind}`);
    if (sensor.kind === "check" && !CHECK_TYPES.has(sensor.check?.type)) errors.push(`${entry.path}: unknown check type`);
  }
  for (const entry of registry.components.workflows || []) {
    if (!fs.existsSync(osPath(entry.path))) continue;
    const wf = readYml(osPath(entry.path));
    for (const key of ["id", "phases", "stopConditions", "outputs", "stateTransitions", "rollback"]) if (!(key in wf)) errors.push(`${entry.path}: missing ${key}`);
    for (const phase of wf.phases || []) {
      for (const agent of phase.agents || []) if (!agentIds.has(agent)) errors.push(`${entry.path} phase ${phase.id}: unknown agent ${agent}`);
      for (const skill of phase.skills || []) if (!skillIds.has(skill)) errors.push(`${entry.path} phase ${phase.id}: unknown skill ${skill}`);
      for (const gate of phase.gates || []) if (!gateIds.has(gate)) errors.push(`${entry.path} phase ${phase.id}: unknown gate ${gate}`);
    }
  }
  for (const [domain, route] of Object.entries(registry.routing)) {
    for (const agent of [route.lead, ...(route.subagents || []), ...(route.reviewers || []), route.auditor].filter(Boolean)) if (!agentIds.has(agent)) errors.push(`routing ${domain}: unknown agent ${agent}`);
    if (route.workflow && !(registry.components.workflows || []).some((w) => w.id === route.workflow)) errors.push(`routing ${domain}: unknown workflow ${route.workflow}`);
  }
  for (const provider of registry.providers) for (const file of PROVIDER_FILES) if (!fs.existsSync(osPath("integrations", provider, file))) errors.push(`integrations/${provider}/${file} missing`);

  const settingsFile = osPath("settings.json");
  if (fs.existsSync(settingsFile)) {
    const settings = readJson(settingsFile);
    for (const hooks of Object.values(settings.hooks || {})) for (const group of hooks) for (const hook of group.hooks || []) {
      const script = hook.command?.match(/[\w$./-]+\.(mjs|js|cjs|sh)\b/)?.[0]?.replace(/^\$?CLAUDE_PROJECT_DIR\//, "");
      if (!script || !script.startsWith(".claude/runtime/")) errors.push(`settings.json hook must run a script under .claude/runtime/: ${hook.command}`);
      else if (!fs.existsSync(path.join(REPO_ROOT, script))) errors.push(`settings.json hook references missing ${script}`);
    }
  }
  const missionFile = osPath("state", "mission.yml");
  if (fs.existsSync(missionFile)) {
    const missionSchema = readJson(osPath("contracts", "mission.schema.json"));
    const state = readYml(missionFile);
    for (const m of [state.current, ...(state.history || [])].filter(Boolean)) errors.push(...validate(missionSchema, m).map((e) => `state/mission.yml ${m.id}: ${e}`));
  }
  const integrationSchema = readJson(osPath("contracts", "integration.schema.json"));
  const integrations = readYml(osPath("state", "integrations.yml"));
  for (const [provider, record] of Object.entries(integrations.providers || {})) {
    errors.push(...validate(integrationSchema, { provider, observedAt: integrations.observedAt, ...record }).map((e) => `state/integrations.yml ${provider}: ${e}`));
    if (!registry.providers.includes(provider)) errors.push(`state/integrations.yml: unknown provider ${provider}`);
  }
  const zodKeys = contactZodKeys();
  if (zodKeys) {
    const schemaKeys = Object.keys(readJson(osPath("schemas", "contact-payload.schema.json")).properties).sort();
    if (JSON.stringify(zodKeys) !== JSON.stringify(schemaKeys)) errors.push(`schemas/contact-payload.schema.json drifted from app/api/contact/route.ts payloadSchema (zod: ${zodKeys.join(",")}; schema: ${schemaKeys.join(",")})`);
  }
  errors.push(...verifyChain());

  const findings = loadFindings();
  errors.push(...findings.flatMap((f) => validateFinding(f)));
  for (const f of findings) for (const ev of f.evidenceRecords || []) if (!fs.existsSync(osPath("evidence", `${ev}.json`))) errors.push(`${f.id}: evidence ${ev} missing`);
  for (const f of findings) if (f.decision && !fs.readdirSync(osPath("decisions")).some((n) => n.startsWith(f.decision))) errors.push(`${f.id}: decision ${f.decision} missing`);
  const evidenceSchema = readJson(osPath("contracts", "evidence.schema.json"));
  for (const record of loadEvidence()) errors.push(...validate(evidenceSchema, record).map((e) => `${record.id}: ${e}`));
  errors.push(...gitAnchorErrors());
  const decisionsFile = osPath("state", "decisions.yml");
  if (!fs.existsSync(decisionsFile) || JSON.stringify(readYml(decisionsFile)) !== JSON.stringify(buildDecisions(findings))) errors.push("state/decisions.yml is stale: run node .claude/runtime/findings.mjs index");
  const indexFile = osPath("state", "findings.yml");
  if (!fs.existsSync(indexFile) || JSON.stringify(readYml(indexFile)) !== JSON.stringify(buildIndex(findings))) errors.push("state/findings.yml is stale: run node .claude/runtime/findings.mjs index");
  return { errors, stats: { files: all.length, findings: findings.length, evidence: loadEvidence().length, registered: registered.size } };
}

/**
 * Git is the trust anchor for records: once committed, an evidence record is immutable and a finding's
 * history is append-only. New (uncommitted) history entries may not be marked reconstructed.
 */
/**
 * Records are anchored in git history, not only against HEAD (ADR-0007 §3): from the commit that introduced
 * ADR-0007 on, every committed version of an evidence record equals its first version, and every committed version
 * of a finding keeps the previous version's history as a prefix and its requiredTests as a subset, and the closed-mission
 * history in state/mission.yml is append-only. The working copy
 * is checked against the last committed version the same way.
 */
export function gitAnchorErrors() {
  const errors = [];
  if (!git(["rev-parse", "--verify", "HEAD"], { allowFail: true })) return errors;
  const cutoff = git(["log", "--diff-filter=A", "--format=%H", "--", ".claude/decisions/ADR-0007-trust-model.md"], { allowFail: true }).split("\n").filter(Boolean).at(-1);
  const range = cutoff ? [`${cutoff}^!`, `${cutoff}..HEAD`] : ["HEAD"];
  const versions = new Map(); // file -> ordered commits touching it (cutoff first)
  for (const spec of range) {
    let commit = null;
    // --full-history -m: merge commits list their files too, so a merge cannot hide a rewritten version.
    for (const line of git(["log", "--reverse", "--topo-order", "--full-history", "-m", "--format=C %H", "--name-only", spec, "--", ".claude/evidence", ".claude/findings", ".claude/state/mission.yml"], { allowFail: true }).split("\n")) {
      if (line.startsWith("C ")) { commit = line.slice(2); continue; }
      if (!/\/(EV|F)-\d{4}\.json$|^\.claude\/state\/mission\.yml$/.test(line)) continue;
      if (!versions.has(line)) versions.set(line, []);
      if (versions.get(line).at(-1) !== commit) versions.get(line).push(commit);
    }
  }
  // A file present at the cutoff but untouched since still needs its cutoff version as the baseline.
  if (cutoff) for (const file of git(["ls-tree", "-r", "--name-only", cutoff, "--", ".claude/evidence", ".claude/findings", ".claude/state/mission.yml"], { allowFail: true }).split("\n").filter((f) => /\/(EV|F)-\d{4}\.json$|^\.claude\/state\/mission\.yml$/.test(f))) {
    if (!versions.has(file)) versions.set(file, []);
    if (versions.get(file)[0] !== cutoff) versions.get(file).unshift(cutoff);
  }
  const blobs = catFiles([...versions].flatMap(([file, commits]) => commits.map((c) => `${c}:${file}`)));
  const parse = (text) => { try { return text == null ? null : JSON.parse(text.split("\n").filter((l) => !l.startsWith("#")).join("\n")); } catch { return undefined; } };
  for (const [file, commits] of versions) {
    const chain = commits.map((c) => ({ at: c.slice(0, 7), value: parse(blobs.get(`${c}:${file}`)) }));
    const full = path.join(REPO_ROOT, file);
    chain.push({ at: "working copy", value: fs.existsSync(full) ? parse(fs.readFileSync(full, "utf8")) : null });
    const first = chain.findIndex((v) => v.value);
    if (first < 0) continue;
    for (let i = first + 1; i < chain.length; i += 1) {
      const before = chain[first + (file.includes("/evidence/") ? 0 : i - first - 1)].value;
      const now = chain[i].value;
      if (now === null) { errors.push(`${file}: committed record was deleted (${chain[i].at})`); break; }
      if (now === undefined || !before) { errors.push(`${file}: unreadable record (${chain[i].at})`); break; }
      if (file.endsWith("mission.yml")) {
        // Closed missions are append-only: an ABORTED entry cannot later read COMPLETED (it would move the scope base).
        const m0 = before.history || [], m1 = now.history || [];
        if (JSON.stringify(m1.slice(0, m0.length)) !== JSON.stringify(m0)) { errors.push(`${file}: committed mission history was rewritten (${chain[i].at})`); break; }
        continue;
      }
      if (file.includes("/evidence/")) {
        if (JSON.stringify(now) !== JSON.stringify(before)) { errors.push(`${file}: committed evidence was modified (${chain[i].at})`); break; }
        continue;
      }
      const h0 = before.history || [], h1 = now.history || [];
      if (JSON.stringify(h1.slice(0, h0.length)) !== JSON.stringify(h0)) { errors.push(`${file}: committed history was rewritten (${chain[i].at}; history is append-only)`); break; }
      if (h1.slice(h0.length).some((h) => h.reconstructed)) { errors.push(`${file}: new history entries cannot be marked reconstructed (${chain[i].at})`); break; }
      const lost = (before.requiredTests || []).filter((t) => !(now.requiredTests || []).includes(t));
      if (lost.length) { errors.push(`${file}: requiredTests entries removed (${chain[i].at}): ${lost.join(", ")}`); break; }
    }
  }
  const untrackedFindings = git(["ls-files", "--others", "--exclude-standard", "--", ".claude/findings"], { allowFail: true }).split("\n").filter(Boolean);
  for (const file of untrackedFindings) {
    const f = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, file), "utf8"));
    if ((f.history || []).some((h) => h.reconstructed)) errors.push(`${file}: new findings cannot contain reconstructed history`);
  }
  return errors;
}
