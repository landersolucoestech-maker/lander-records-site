#!/usr/bin/env node
import {StateStore,argMap,root,workspaceFingerprint,failClosed,EngineeringOSError,uid} from './lib/core.mjs';
import {issueRuntimeExecution} from './lib/execution.mjs';
const a=argMap(),cmd=a._[0]||'list',r=root(),store=new StateStore(r);
try{
 if(['producer','reviewer','principal','result'].some(key=>a[key]))throw new EngineeringOSError('POLICY_BLOCKED','Reviewer identity and PASS cannot be supplied by the caller');
 if(cmd==='list'){console.log(JSON.stringify(store.read().reviews,null,2));process.exit(0)}
 if(cmd!=='record-advisory')throw new EngineeringOSError('UNSUPPORTED_BY_HOST','Certified independent review requires a host-issued principal unavailable to this CLI');
 const result=store.transaction(state=>{const execution=issueRuntimeExecution(r,state,{roleId:String(a.role||'advisory-reviewer'),capabilities:['review:advisory']});state.reviews.push({id:a.id||uid('REV'),executionId:execution.executionId,principalId:execution.principalId,principalClass:execution.principalClass,roleId:execution.roleId,result:'BLOCKED',scope:String(a.scope||'mission'),evidenceIds:[],workspaceFingerprint:workspaceFingerprint(r).fingerprint,timestamp:new Date().toISOString()})});
 console.log(JSON.stringify({...result.state.reviews.at(-1),certificationEligible:false,reason:'UNSUPPORTED_BY_HOST'},null,2));process.exit(77);
}catch(error){failClosed(error)}
