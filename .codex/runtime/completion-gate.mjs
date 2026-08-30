#!/usr/bin/env node
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadState,workspaceFingerprint,root,cdir,readJson} from './lib/core.mjs';
const r=root(),c=cdir(r),s=loadState(),fp=workspaceFingerprint().fingerprint,block=[];
const registry=readJson(path.join(c,'agents','registry.json'),{}).agents||[];
const roleByName=new Map(registry.map(x=>[x.name,x]));
if(!['COMPLETING','ACTIVE','VERIFYING','REVIEWING'].includes(s.mission?.status)) block.push('mission-not-active');
for(const req of s.requirements||[]){const ids=(s.criteria||[]).filter(x=>x.requirementId===req.id);if(ids.length===0)block.push(`requirement-without-criteria:${req.id}`)}
for(const criterion of (s.criteria||[]).filter(x=>x.mandatory!==false)){
  const fresh=(s.evidence||[]).filter(e=>e.criterionId===criterion.id&&(!e.invalidatesOnChange||e.workspaceFingerprint===fp)).sort((a,b)=>String(a.timestamp).localeCompare(String(b.timestamp)));
  const latest=fresh.at(-1);
  if(!latest) block.push(`criterion-without-fresh-evidence:${criterion.id}`);
  else if(latest.result!=='PASS') block.push(`criterion-latest-not-pass:${criterion.id}:${latest.result}`);
}
for(const f of s.findings||[]) if(f.status==='OPEN'&&['HIGH','CRITICAL','BLOCKER'].includes(f.severity)) block.push(`unresolved-finding:${f.id}`);
for(const e of s.sideEffects||[]) if(['STARTED','FAILED','PARTIAL'].includes(e.status)) block.push(`unreconciled-side-effect:${e.id}`);
const impact=s.impact?.level||'L0',n=Number(impact[1]);
const reviewByProducer=new Map();for(const rv of (s.reviews||[]).filter(x=>x.workspaceFingerprint===fp).sort((a,b)=>String(a.timestamp).localeCompare(String(b.timestamp))))reviewByProducer.set(rv.producer,rv);const reviewers=new Set([...reviewByProducer.entries()].filter(([name,rv])=>rv.result==='PASS'&&roleByName.get(name)?.mode==='read').map(([name])=>name));
if(n>=3&&reviewers.size<1)block.push('independent-review-record-missing');
if(n>=4&&!reviewers.has('architecture-reviewer'))block.push('architecture-review-record-missing');
if(n>=5){for(const required of ['security-reviewer','adversarial-reviewer','git-auditor'])if(!reviewers.has(required))block.push(`required-L5-review-missing:${required}`)}
const preflight=readJson(path.join(c,'state','preflight.json'),null);
if(n>=1){if(!preflight)block.push('preflight-missing');else if(preflight.checks?.some(x=>!x.ok))block.push('preflight-had-failures')}
try{
  const raw=execFileSync(process.execPath,[path.join(c,'runtime','localhost-guardian.mjs'),'status','--quiet'],{cwd:r,encoding:'utf8'});const health=JSON.parse(raw);
  if(health.ok===false)block.push(`localhost-unhealthy:${health.detail||'unknown'}`);if(health.degraded)block.push(`localhost-degraded:${health.detail||'unknown'}`);
}catch{const cfg=readJson(path.join(c,'localhost-guardian.json'),{});if(cfg.required!==false)block.push('localhost-guardian-check-failed')}
const result={verdict:block.length?'BLOCKED':'PASS',workspaceFingerprint:fp,impact,independentReviewers:[...reviewers],blockers:[...new Set(block)]};console.log(JSON.stringify(result,null,2));process.exit(block.length?2:0);
