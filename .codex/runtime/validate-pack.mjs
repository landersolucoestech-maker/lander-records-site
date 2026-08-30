#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,cdir,walk,readJson} from './lib/core.mjs';
const r=root(),c=cdir(r),errors=[],warnings=[];
const req=rel=>{if(!fs.existsSync(path.join(r,rel)))errors.push(`missing:${rel}`)};
const distribution=fs.existsSync(path.join(r,'PACK-MANIFEST.json'));
for(const rel of [
 'AGENTS.md',
 '.codex/engineering-os.json','.codex/docs-index.md','.codex/agents/registry.json',
 '.codex/runtime/doctor.mjs','.codex/runtime/discover.mjs','.codex/runtime/impact.mjs',
 '.codex/runtime/completion-gate.mjs','.codex/runtime/preflight.mjs','.codex/runtime/localhost-guardian.mjs',
 '.codex/localhost-guardian.json','.codex/policies/localhost-continuity.json','.codex/rules/localhost-continuity.md',
 '.codex/skills/localhost-guardian/SKILL.md','.codex/skills/control-plane/SKILL.md','.codex/agents/core/runtime-continuity-controller.md',
 '.codex/runtime/aceo.mjs','.codex/runtime/mission.mjs','.codex/runtime/evidence.mjs','.codex/runtime/review.mjs','.codex/runtime/finding.mjs','.codex/runtime/side-effect.mjs','.codex/runtime/ownership.mjs','.codex/runtime/policy-gate.mjs','.codex/runtime/execution-graph.mjs','.codex/runtime/context-packet.mjs','.codex/runtime/checkpoint.mjs','.codex/runtime/safe-exec.mjs','.codex/contracts/review-record.schema.json'
]) req(rel);
if(distribution)for(const rel of ['README.md','ARCHITECTURE.md','SECURITY-MODEL.md','PACK-MANIFEST.json','INTEGRITY.json'])req(rel);
const os=readJson(path.join(c,'engineering-os.json'),{});
if(os.version!=='2.0.0-HARDENED') errors.push(`unexpected-version:${os.version}`);
const reg=readJson(path.join(c,'agents','registry.json'),{}),agents=reg.agents||[],names=new Set();
if(agents.length<47) errors.push(`agent-registry-too-small:${agents.length}`);
for(const a of agents){if(names.has(a.name))errors.push(`duplicate-agent:${a.name}`);names.add(a.name);if(!['read','write'].includes(a.mode))errors.push(`invalid-agent-mode:${a.name}`);req(a.path)}
if(!names.has('runtime-continuity-controller')) errors.push('runtime-continuity-controller-unregistered');
const skillFiles=walk(path.join(c,'skills')).filter(x=>path.basename(x)==='SKILL.md');
const ruleFiles=walk(path.join(c,'rules')).filter(x=>x.endsWith('.md'));
const policyFiles=walk(path.join(c,'policies')).filter(x=>x.endsWith('.json'));
if(skillFiles.length<23)errors.push(`skill-registry-too-small:${skillFiles.length}`);
if(ruleFiles.length<18)errors.push(`rule-registry-too-small:${ruleFiles.length}`);
if(policyFiles.length<8)errors.push(`policy-registry-too-small:${policyFiles.length}`);
for(const p of walk(c).filter(x=>x.endsWith('.json'))){try{JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){errors.push(`invalid-json:${path.relative(r,p)}:${e.message}`)}}
for(const p of walk(c).filter(x=>x.endsWith('.md'))){const t=fs.readFileSync(p,'utf8');if(p.includes(`${path.sep}agents${path.sep}`)&&!t.startsWith('---\n'))errors.push(`agent-frontmatter-missing:${path.relative(r,p)}`);if(/MUSIC OS 360|\.claude\/|CLAUDE\.md|Anthropic-specific/i.test(t))errors.push(`reference-leak:${path.relative(r,p)}`)}
for(const p of walk(c).filter(x=>x.endsWith('.mjs'))){const z=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(z.status!==0)errors.push(`invalid-js:${path.relative(r,p)}:${(z.stderr||z.stdout).trim()}`)}
const ag=fs.readFileSync(path.join(r,'AGENTS.md'),'utf8');
if(!ag.includes('preflight.mjs')) errors.push('AGENTS-missing-preflight');
if(!ag.includes('localhost-guardian.mjs')) errors.push('AGENTS-missing-localhost-guardian');
if(Buffer.byteLength(ag)>32768)warnings.push('AGENTS.md exceeds default 32KiB project-instruction budget');
const lc=readJson(path.join(c,'localhost-guardian.json'),null);
if(!lc||lc.required!==true||lc.enabled!==true) errors.push('localhost-guardian-not-required-by-default');
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',mode:distribution?'distribution':'installed',counts:{agents:agents.length,skills:skillFiles.length,rules:ruleFiles.length,policies:policyFiles.length,files:walk(r).length},errors,warnings},null,2));process.exit(errors.length?1:0);
