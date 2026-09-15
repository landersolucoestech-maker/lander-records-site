#!/usr/bin/env node
import crypto from 'node:crypto';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {StateStore,root,cdir,workspaceFingerprint,failClosed,validateContract} from './lib/core.mjs';
import {issueRuntimeExecution} from './lib/execution.mjs';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const r=root(),store=new StateStore(r);
try{
 const result=store.transaction(state=>{
  const execution=issueRuntimeExecution(r,state,{roleId:'verification-controller',capabilities:['preflight:execute']});
  const commands=[{name:'doctor',argv:[path.join(cdir(r),'runtime','doctor.mjs')]},{name:'validate',argv:[path.join(cdir(r),'runtime','validate-pack.mjs')]}];
  const checks=commands.map(item=>{const child=spawnSync(process.execPath,item.argv,{cwd:r,encoding:'utf8',shell:false});const output=`${child.stdout||''}\n${child.stderr||''}`;return {name:item.name,ok:child.status===0,exitCode:Number.isInteger(child.status)?child.status:1,outputHash:hash(output)}});
  const unsigned={schemaVersion:2,identity:structuredClone(state.identity),executionId:execution.executionId,timestamp:new Date().toISOString(),workspaceFingerprint:workspaceFingerprint(r).fingerprint,checks};
  state.preflight={...unsigned,checksum:hash(JSON.stringify(unsigned))};validateContract(r,'preflight-record',state.preflight);
 });
 const record=result.state.preflight,bad=record.checks.filter(x=>!x.ok);console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',...record},null,2));process.exit(bad.length?2:0);
}catch(error){failClosed(error)}
