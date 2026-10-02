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
