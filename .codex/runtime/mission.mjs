#!/usr/bin/env node
import {root,StateStore,uid,argMap,workspaceFingerprint,failClosed,EngineeringOSError} from './lib/core.mjs';
import {issueRuntimeExecution} from './lib/execution.mjs';

const a=argMap(),cmd=a._[0]||'status',r=root(),store=new StateStore(r),now=()=>new Date().toISOString();
try{
  let output;
  if(cmd==='init'){
    let initialized;
    try{initialized=store.initialize({quarantineIncompatible:true,branchPolicy:a['branch-policy']==='repository'?'repository':'exact'})}
    catch(error){throw error}
    if(initialized.mission?.status!=='IDLE')store.quarantine('mission-reinitialized');
    output=store.transaction(state=>{
      const id=a.id||uid('MISSION'),scope=a.scope==='repository'?'repository':'bounded',startedAt=now();
      state.mission={id,title:a.title||'Untitled mission',status:'ACTIVE',scope,workflowId:a.workflow||null,startedAt,updatedAt:startedAt,workspaceFingerprintAtStart:workspaceFingerprint(r).fingerprint,rootExecutionId:null};
      state.impact=null;state.requirements=[];state.criteria=[];state.executions=[];state.authorityGrants=[];state.evidence=[];state.reviews=[];state.findings=[];state.sideEffects=[];state.coverage=null;state.workflow=null;state.executionGraph=null;
      const execution=issueRuntimeExecution(r,state,{roleId:'mission-controller',capabilities:['mission:initialize']});state.mission.rootExecutionId=execution.executionId;return {mission:state.mission,execution};
    }).result;
  }else if(cmd==='status')output=store.read();
  else if(cmd==='set-status'){
    const next=a.status||a._[1],allowed={ACTIVE:['IMPLEMENTATION_COMPLETE','CERTIFICATION_BLOCKED'],IMPLEMENTATION_COMPLETE:['VERIFICATION_PENDING','CERTIFICATION_BLOCKED'],VERIFICATION_PENDING:['CERTIFICATION_BLOCKED'],CERTIFICATION_BLOCKED:['ACTIVE','VERIFICATION_PENDING'],CERTIFIED:[],IDLE:[]};
    output=store.transaction(state=>{const current=state.mission.status;if(!(allowed[current]||[]).includes(next))throw new EngineeringOSError('POLICY_BLOCKED','Invalid mission status transition',{current,next});const execution=issueRuntimeExecution(r,state,{roleId:'mission-controller',capabilities:['mission:transition']});state.mission.status=next;state.mission.updatedAt=now();return {mission:state.mission,execution};}).result;
  }else if(cmd==='add-requirement'){
    const id=a.id||uid('REQ'),text=a.text||a._.slice(1).join(' ');if(!text)throw new EngineeringOSError('STATE_SCHEMA_INVALID','Requirement text required');
    output=store.transaction(state=>{if(state.requirements.some(item=>item.id===id))throw new EngineeringOSError('STATE_SCHEMA_INVALID','Duplicate requirement ID',{id});issueRuntimeExecution(r,state,{roleId:'mission-controller',capabilities:['requirement:write']});const requirement={id,text,criteria:[]};state.requirements.push(requirement);return requirement}).result;
  }else if(cmd==='add-criterion'){
    const requirementId=a.requirement||a.req,id=a.id||uid('AC'),text=a.text||a._.slice(1).join(' ');if(!requirementId||!text)throw new EngineeringOSError('STATE_SCHEMA_INVALID','--requirement and --text required');
    output=store.transaction(state=>{const requirement=state.requirements.find(item=>item.id===requirementId);if(!requirement)throw new EngineeringOSError('STATE_SCHEMA_INVALID','Unknown requirement',{requirementId});if(state.criteria.some(item=>item.id===id))throw new EngineeringOSError('STATE_SCHEMA_INVALID','Duplicate criterion ID',{id});issueRuntimeExecution(r,state,{roleId:'mission-controller',capabilities:['criterion:write']});const criterion={id,requirementId,text,mandatory:a.optional?false:true,evidenceKinds:String(a.kinds||'test').split(',').filter(Boolean)};state.criteria.push(criterion);requirement.criteria.push(id);return criterion}).result;
  }else throw new EngineeringOSError('STATE_SCHEMA_INVALID','Usage: mission.mjs init|status|set-status|add-requirement|add-criterion');
  console.log(JSON.stringify(output,null,2));
}catch(error){failClosed(error)}
