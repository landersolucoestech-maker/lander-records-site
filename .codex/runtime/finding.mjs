#!/usr/bin/env node
import {root,StateStore,uid,argMap,workspaceFingerprint,validateContract,failClosed,EngineeringOSError} from './lib/core.mjs';
import {issueRuntimeExecution,executionById,isIndependentTrustedReviewer} from './lib/execution.mjs';

const a=argMap(),cmd=a._[0]||'list',r=root(),store=new StateStore(r),iso=()=>new Date().toISOString();
const high=severity=>['HIGH','CRITICAL','BLOCKER'].includes(severity);
const transition=(finding,to,execution,reason=null)=>{const from=finding.status;finding.status=to;finding.updatedAt=iso();finding.history.push({from,to,executionId:execution.executionId,at:finding.updatedAt,reason});return finding};

try{
  if(a.producer||a.verifier||cmd==='resolve')throw new EngineeringOSError('POLICY_BLOCKED','Caller-asserted producer/verifier and direct resolution are forbidden');
  if(cmd==='list'){console.log(JSON.stringify(store.read().findings,null,2));process.exit(0)}
  const id=a.id||a._[1];let output;
  output=store.transaction(state=>{
    if(cmd==='record'){
      const severity=String(a.severity||'MEDIUM').toUpperCase(),summary=a.summary||a._.slice(1).join(' ');if(!summary||!['INFO','LOW','MEDIUM','HIGH','CRITICAL','BLOCKER'].includes(severity))throw new EngineeringOSError('STATE_SCHEMA_INVALID','Invalid finding');if(state.findings.some(item=>item.id===id))throw new EngineeringOSError('STATE_SCHEMA_INVALID','Duplicate finding ID',{id});
      const execution=issueRuntimeExecution(r,state,{roleId:'runtime-investigator',capabilities:['finding:record']}),at=iso(),finding={id:id||uid('FIND'),severity,status:'OPEN',summary,reporterExecutionId:execution.executionId,fixExecutionId:null,verifierExecutionId:null,resolutionReference:null,fixFingerprint:null,verificationEvidenceIds:[],createdAt:at,updatedAt:at,history:[{from:null,to:'OPEN',executionId:execution.executionId,at,reason:null}]};validateContract(r,'finding-record',finding);state.findings.push(finding);return finding;
    }
    const finding=state.findings.find(item=>item.id===id);if(!finding)throw new EngineeringOSError('STATE_SCHEMA_INVALID','Unknown finding',{id});
    if(cmd==='start'){
      if(finding.status!=='OPEN')throw new EngineeringOSError('POLICY_BLOCKED','Finding must be OPEN before work starts',{id,status:finding.status});const execution=issueRuntimeExecution(r,state,{roleId:'implementation-runtime',capabilities:['finding:fix']});finding.fixExecutionId=execution.executionId;return transition(finding,'FIX_IN_PROGRESS',execution,a.reason||null);
    }
    if(cmd==='mark-fixed'){
      if(finding.status!=='FIX_IN_PROGRESS'||!a.resolution||!a.evidence)throw new EngineeringOSError('POLICY_BLOCKED','mark-fixed requires FIX_IN_PROGRESS, --resolution and --evidence',{id,status:finding.status});const evidence=state.evidence.find(item=>item.id===a.evidence);if(!evidence||evidence.result!=='PASS'||evidence.workspaceFingerprint!==workspaceFingerprint(r).fingerprint)throw new EngineeringOSError('POLICY_BLOCKED','Fix evidence must be fresh executed PASS',{evidenceId:a.evidence});const execution=issueRuntimeExecution(r,state,{roleId:'implementation-runtime',capabilities:['finding:mark-fixed']});finding.fixExecutionId=execution.executionId;finding.resolutionReference=a.resolution;finding.fixFingerprint=workspaceFingerprint(r).fingerprint;finding.verificationEvidenceIds=[a.evidence];return transition(finding,'FIXED_PENDING_VERIFICATION',execution,a.resolution);
    }
    if(cmd==='verify'){
      if(finding.status!=='FIXED_PENDING_VERIFICATION'||!a.evidence)throw new EngineeringOSError('POLICY_BLOCKED','verify requires FIXED_PENDING_VERIFICATION and --evidence',{id,status:finding.status});const evidence=state.evidence.find(item=>item.id===a.evidence);if(!evidence||evidence.result!=='PASS'||evidence.workspaceFingerprint!==workspaceFingerprint(r).fingerprint)throw new EngineeringOSError('POLICY_BLOCKED','Verification evidence must be fresh executed PASS',{evidenceId:a.evidence});const execution=issueRuntimeExecution(r,state,{roleId:'verification-runtime',capabilities:['finding:verify']});const fixer=executionById(state,finding.fixExecutionId);if(high(finding.severity)&&!isIndependentTrustedReviewer(execution,[fixer]))throw new EngineeringOSError('UNSUPPORTED_BY_HOST','HIGH/CRITICAL verification requires an independent host-agent or human principal',{id,principalClass:execution.principalClass});if(fixer?.principalId===execution.principalId)throw new EngineeringOSError('POLICY_BLOCKED','Self-verification is forbidden',{id});finding.verifierExecutionId=execution.executionId;finding.verificationEvidenceIds=[...new Set([...finding.verificationEvidenceIds,a.evidence])];return transition(finding,'VERIFIED',execution,a.reason||null);
    }
    if(cmd==='close'){
      if(finding.status!=='VERIFIED'||!finding.resolutionReference||!finding.verifierExecutionId)throw new EngineeringOSError('POLICY_BLOCKED','Only VERIFIED findings with resolution and verifier can close',{id,status:finding.status});const execution=issueRuntimeExecution(r,state,{roleId:'finding-controller',capabilities:['finding:close']});return transition(finding,'CLOSED',execution,a.reason||null);
    }
    if(cmd==='block'){
      if(!a.reason)throw new EngineeringOSError('STATE_SCHEMA_INVALID','--reason is required');const execution=issueRuntimeExecution(r,state,{roleId:'finding-controller',capabilities:['finding:block']});return transition(finding,'BLOCKED',execution,a.reason);
    }
    if(cmd==='request-waiver'){
      if(!a.reason)throw new EngineeringOSError('STATE_SCHEMA_INVALID','--reason is required');const execution=issueRuntimeExecution(r,state,{roleId:'finding-controller',capabilities:['finding:request-waiver']});return transition(finding,'WAIVED_PENDING_APPROVAL',execution,a.reason);
    }
    if(cmd==='waive')throw new EngineeringOSError('UNSUPPORTED_BY_HOST','Waiver requires an externally signed authority grant; no trusted host signer is configured',{id});
    throw new EngineeringOSError('STATE_SCHEMA_INVALID','Usage: finding.mjs list|record|start|mark-fixed|verify|close|block|request-waiver|waive');
  }).result;
  console.log(JSON.stringify(output,null,2));
}catch(error){failClosed(error)}
