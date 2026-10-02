#!/usr/bin/env node
import crypto from 'node:crypto';
import {StateStore,root,workspaceFingerprint,failClosed} from './lib/core.mjs';
import {executionById,isIndependentTrustedReviewer} from './lib/execution.mjs';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
try{
 const r=root(),s=new StateStore(r).read(),fp=workspaceFingerprint(r).fingerprint,block=[];
 if(!s.mission?.id||!['IMPLEMENTATION_COMPLETE','VERIFICATION_PENDING','CERTIFICATION_BLOCKED'].includes(s.mission.status))block.push('mission-not-ready-for-certification');
 if(!s.requirements.length)block.push('requirements-empty');if(!s.criteria.length)block.push('criteria-empty');
 for(const req of s.requirements)if(!s.criteria.some(c=>c.requirementId===req.id))block.push(`requirement-without-criteria:${req.id}`);
 for(const criterion of s.criteria.filter(c=>c.mandatory)){
  const valid=s.evidence.filter(e=>e.criterionId===criterion.id&&e.result==='PASS'&&e.exitCode===0&&e.workspaceFingerprint===fp&&criterion.evidenceKinds?.includes(e.kind)).filter(e=>{const execution=executionById(s,e.executionId);return execution&&execution.principalId===e.principalId&&e.command&&e.argv.length&&e.finishedAt>=e.startedAt});
  if(!valid.length)block.push(`criterion-without-current-executed-evidence:${criterion.id}`);
 }
 const p=s.preflight;if(!p)block.push('preflight-missing');else{const {checksum,...unsigned}=p;if(hash(JSON.stringify(unsigned))!==checksum)block.push('preflight-checksum-invalid');if(p.workspaceFingerprint!==fp)block.push('preflight-stale');if(p.checks.some(c=>!c.ok||c.exitCode!==0))block.push('preflight-failed');if(p.identity.repository.id!==s.identity.repository.id||p.identity.worktree.id!==s.identity.worktree.id)block.push('preflight-identity-mismatch')}
 for(const f of s.findings)if(!['CLOSED','WAIVED'].includes(f.status)&&['HIGH','CRITICAL','BLOCKER'].includes(f.severity))block.push(`unresolved-finding:${f.id}:${f.status}`);
 for(const e of s.sideEffects)if(!['SUCCEEDED','RECONCILED','BLOCKED'].includes(e.status))block.push(`unreconciled-side-effect:${e.id}`);
 if(s.mission.scope==='repository'){if(!s.coverage)block.push('repository-coverage-missing');else if(s.coverage.status!=='VERIFIED'||s.coverage.workspaceFingerprint!==fp||s.coverage.uncovered?.length)block.push('repository-coverage-not-current-and-verified')}
 if(s.mission.workflowId){if(!s.workflow)block.push('workflow-ledger-missing');else if(s.workflow.status!=='COMPLETED'||s.workflow.stages?.some(x=>x.required&&x.status!=='COMPLETED'))block.push('workflow-incomplete')}
 const impact=Number((s.impact?.level||'L0').slice(1));if(impact>=3){const implementations=s.executions.filter(x=>x.capabilities.some(c=>/write|implement|fix/.test(c)));const trusted=s.reviews.filter(rv=>rv.result==='PASS'&&rv.workspaceFingerprint===fp).filter(rv=>isIndependentTrustedReviewer(executionById(s,rv.executionId),implementations));if(!trusted.length)block.push('independent-review-unsupported-or-missing')}
 const out={verdict:block.length?'BLOCKED':'CERTIFIED',workspaceFingerprint:fp,impact:s.impact?.level||'L0',blockers:[...new Set(block)]};console.log(JSON.stringify(out,null,2));process.exit(block.length?2:0);
}catch(error){failClosed(error)}
