#!/usr/bin/env node
import {normalizedState,saveState,uid,argMap,workspaceFingerprint} from './lib/core.mjs';
const a=argMap(),cmd=a._[0]||'status',s=normalizedState();
if(cmd==='init'){
  s.mission={id:a.id||uid('MISSION'),title:a.title||'Untitled mission',status:'ACTIVE',startedAt:new Date().toISOString(),authority:a.authority||'A3',workspaceFingerprintAtStart:workspaceFingerprint().fingerprint};
  s.impact=null;s.requirements=[];s.criteria=[];s.evidence=[];s.reviews=[];s.findings=[];s.sideEffects=[];saveState(s);
}else if(cmd==='status'){}
else if(cmd==='set-status'){const v=a.status||a._[1];if(!['IDLE','ACTIVE','VERIFYING','REVIEWING','COMPLETING','BLOCKED','DONE'].includes(v)){console.error('invalid status');process.exit(64)}s.mission.status=v;s.mission.updatedAt=new Date().toISOString();saveState(s)}
else if(cmd==='add-requirement'){const id=a.id||uid('REQ'),text=a.text||a._.slice(1).join(' ');if(!text){console.error('requirement text required');process.exit(64)}s.requirements.push({id,text,criteria:[]});saveState(s)}
else if(cmd==='add-criterion'){const requirementId=a.requirement||a.req,id=a.id||uid('AC'),text=a.text||a._.slice(1).join(' ');if(!requirementId||!text){console.error('--requirement and --text required');process.exit(64)}if(!s.requirements.some(x=>x.id===requirementId)){console.error('unknown requirement');process.exit(65)}s.criteria.push({id,requirementId,text,mandatory:a.optional?false:true});const r=s.requirements.find(x=>x.id===requirementId);r.criteria=[...new Set([...(r.criteria||[]),id])];saveState(s)}
else {console.error('Usage: mission.mjs init|status|set-status|add-requirement|add-criterion');process.exit(64)}
console.log(JSON.stringify(s,null,2));
