#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
import {root,StateStore,uid,argMap,workspaceFingerprint,validateContract,failClosed,EngineeringOSError} from './lib/core.mjs';
import {issueRuntimeExecution} from './lib/execution.mjs';

const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),emptyHash=hash(Buffer.alloc(0)),iso=()=>new Date().toISOString();
const a=argMap(),cmd=a._[0]||'list',r=root(),store=new StateStore(r);

function inputHashes(value){
  const out={};for(const raw of String(value||'').split(',').map(item=>item.trim()).filter(Boolean)){
    const full=path.resolve(r,raw),relative=path.relative(r,full).replace(/\\/g,'/');if(relative.startsWith('..')||path.isAbsolute(relative))throw new EngineeringOSError('POLICY_BLOCKED','Evidence input escapes repository',{input:raw});
    const real=fs.realpathSync(full),rootReal=fs.realpathSync(r);if(real!==rootReal&&!real.startsWith(rootReal+path.sep))throw new EngineeringOSError('POLICY_BLOCKED','Evidence input resolves outside repository',{input:raw,real});
    const stat=fs.statSync(real);if(!stat.isFile())throw new EngineeringOSError('STATE_SCHEMA_INVALID','Evidence input must be a file',{input:raw});out[relative]=hash(fs.readFileSync(real));
  }return out;
}

try{
  if(a.producer||a.reviewer||a.static||String(a.result||'').toUpperCase()==='PASS')throw new EngineeringOSError('POLICY_BLOCKED','Caller-asserted producer, reviewer, static evidence, or PASS is forbidden');
  if(cmd==='list'){console.log(JSON.stringify(store.read().evidence,null,2));process.exit(0)}
  const criterionId=a.criterion||a.criterionId,kind=a.kind||'test';if(!criterionId)throw new EngineeringOSError('STATE_SCHEMA_INVALID','--criterion is required');
  const snapshot=store.read(),criterion=snapshot.criteria.find(item=>item.id===criterionId);if(!criterion)throw new EngineeringOSError('STATE_SCHEMA_INVALID','Unknown criterion',{criterionId});
  if(criterion.evidenceKinds?.length&&!criterion.evidenceKinds.includes(kind))throw new EngineeringOSError('POLICY_BLOCKED','Evidence kind is not permitted for criterion',{criterionId,kind,allowed:criterion.evidenceKinds});
  let record,processExit=0;
  if(cmd==='run'){
    const executable=a._[1],argv=a._.slice(2);if(!executable)throw new EngineeringOSError('STATE_SCHEMA_INVALID','Usage: evidence.mjs run --criterion ID --kind test -- command [args...]');
    const startedAt=iso(),timeout=Math.max(1000,Math.min(Number(a['timeout-ms']||300000),600000));
    const child=spawnSync(executable,argv,{cwd:r,encoding:null,stdio:['ignore','pipe','pipe'],timeout,maxBuffer:20*1024*1024,windowsHide:true,shell:false});
    const finishedAt=iso(),stdout=Buffer.isBuffer(child.stdout)?child.stdout:Buffer.from(child.stdout||''),stderr=Buffer.isBuffer(child.stderr)?child.stderr:Buffer.from(child.stderr||'');
    const blockedCode=child.error?.code==='EACCES'||child.error?.code==='EPERM'?'BLOCKED_BY_PERMISSION':child.error?.code==='ETIMEDOUT'?'TIMEOUT':null;
    const result=blockedCode?'BLOCKED':child.status===0?'PASS':'FAIL';processExit=result==='PASS'?0:result==='BLOCKED'?77:1;
    const fp=workspaceFingerprint(r).fingerprint,inputs=inputHashes(a.inputs);
    record=store.transaction(state=>{const execution=issueRuntimeExecution(r,state,{roleId:'runtime-command',capabilities:['evidence:execute']});const evidence={id:a.id||uid('EV'),criterionId,kind,result,executionId:execution.executionId,principalId:execution.principalId,command:[executable,...argv].join(' '),argv:[executable,...argv],cwd:r,startedAt,finishedAt,exitCode:Number.isInteger(child.status)?child.status:null,stdoutHash:hash(stdout),stderrHash:hash(stderr),stdoutBytes:stdout.length,stderrBytes:stderr.length,workspaceFingerprint:fp,inputHashes:inputs,blockedCode};validateContract(r,'evidence-record',evidence);state.evidence.push(evidence);return evidence}).result;
  }else if(cmd==='record-blocked'||cmd==='record-not-applicable'){
    const result=cmd==='record-blocked'?'BLOCKED':'NOT_APPLICABLE',startedAt=iso(),fp=workspaceFingerprint(r).fingerprint;
    record=store.transaction(state=>{const execution=issueRuntimeExecution(r,state,{roleId:'runtime-observer',capabilities:['evidence:observe']});const evidence={id:a.id||uid('EV'),criterionId,kind,result,executionId:execution.executionId,principalId:execution.principalId,command:'runtime-observation',argv:[],cwd:r,startedAt,finishedAt:iso(),exitCode:null,stdoutHash:emptyHash,stderrHash:emptyHash,stdoutBytes:0,stderrBytes:0,workspaceFingerprint:fp,inputHashes:inputHashes(a.inputs),blockedCode:a.code||null};validateContract(r,'evidence-record',evidence);state.evidence.push(evidence);return evidence}).result;processExit=result==='BLOCKED'?77:0;
  }else throw new EngineeringOSError('STATE_SCHEMA_INVALID','Usage: evidence.mjs list|run|record-blocked|record-not-applicable');
  console.log(JSON.stringify(record,null,2));process.exit(processExit);
}catch(error){failClosed(error)}
