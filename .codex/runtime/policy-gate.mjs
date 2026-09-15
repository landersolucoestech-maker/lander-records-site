#!/usr/bin/env node
import {argMap,normalizedState,EngineeringOSError,failClosed} from './lib/core.mjs';
const a=argMap(),levels={A0:0,A1:1,A2:2,A3:3,A4:4,A5:5};
try{
 if(a.current||a.authority||a.principal)throw new EngineeringOSError('POLICY_BLOCKED','Authority and principal cannot be asserted by CLI arguments');
 const state=normalizedState(),required=String(a.required||'A0'),action=String(a.action||'unspecified'),executionId=String(a.execution||'');
 if(!(required in levels))throw new EngineeringOSError('POLICY_BLOCKED','Invalid required authority',{required});
 const execution=state.executions.find(x=>x.executionId===executionId),block=[];
 if(!execution)block.push('trusted-execution-required');
 const privileged=['production','destructive','purchase','credential-export'].includes(action)||levels[required]>=4;
 let grant=null;
 if(privileged){grant=state.authorityGrants.find(g=>g.granteePrincipal===execution?.principalId&&g.action===action&&g.repositoryId===state.identity.repository.id&&g.consumedAt===null&&new Date(g.expiresAt)>new Date());if(!grant)block.push('external-unconsumed-authority-grant-required')}
 const out={verdict:block.length?'BLOCKED':'PASS',required,action,executionId:execution?.executionId||null,grantId:grant?.grantId||null,blockers:block};console.log(JSON.stringify(out,null,2));process.exit(block.length?2:0);
}catch(error){failClosed(error)}
