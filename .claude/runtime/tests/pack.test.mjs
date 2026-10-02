import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));

test("Claude registries materialize every declared agent and skill",()=>{
  const a=read(".claude/agents/registry.json");
  const s=read(".claude/skills/registry.json");
  const agents=[a.orchestration.primary,...a.orchestration.agents,...a.investigation,...a.engineering,...a.quality,...a.ai,...a.domain,...a.operational];
  const skills=[...s.core,...s.audit,...s.validation,...s.ai,...s.operational];
  for(const n of new Set(agents)) assert.ok(fs.existsSync(path.join(root,".claude/agents",n+".md")),n);
  for(const n of new Set(skills)) assert.ok(fs.existsSync(path.join(root,".claude/skills",n,"SKILL.md")),n);
});
test("Claude is canonical and engineering test entrypoint is not Codex",()=>{
  assert.match(fs.readFileSync(path.join(root,"CLAUDE.md"),"utf8"),/Claude\/Claude Code is the canonical/);
  const p=read("package.json");
  assert.match(p.scripts["test:engineering-os"],/\.claude\/runtime\/tests/);
  assert.doesNotMatch(p.scripts["test:engineering-os"],/\.codex/);
});

test("branch policy is dev-only and main-frozen",()=>{const hook=fs.readFileSync(".claude/hooks/main-only.mjs","utf8");const preTask=fs.readFileSync(".claude/hooks/pre-task.mjs","utf8");const preflight=fs.readFileSync(".claude/runtime/preflight.mjs","utf8");const policy=fs.readFileSync(".claude/rules/GIT.md","utf8");assert.match(hook,/branch!==\"dev\"/);assert.match(preTask,/b!==\"dev\"/);assert.match(preflight,/branch!==\"dev\"/);assert.match(policy,/DEV ONLY \/ MAIN FROZEN/);assert.match(policy,/`main` is frozen/)});
