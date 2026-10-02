#!/usr/bin/env node
import {normalizedState,saveState,uid,argMap} from './lib/core.mjs';
const a=argMap(),cmd=a._[0]||'list',s=normalizedState();
const allowed=['A0','A1','A2','A3','A4','A5'];
if(cmd==='start'){const kind=a.kind||a._[1],authority=a.authority||'A3';if(!kind||!allowed.includes(authority)){console.error('invalid side effect');process.exit(64)}s.sideEffects.push({id:a.id||uid('FX'),kind,status:'STARTED',authority,startedAt:new Date().toISOString(),detail:a.detail||null});saveState(s)}
else if(['succeed','fail','reconcile'].includes(cmd)){const id=a.id||a._[1],e=s.sideEffects.find(x=>x.id===id);if(!e){console.error('unknown side effect');process.exit(65)}e.status=cmd==='succeed'?'SUCCEEDED':cmd==='fail'?'FAILED':'RECONCILED';e.updatedAt=new Date().toISOString();e.detail=a.detail||e.detail;saveState(s)}
else if(cmd!=='list'){console.error('Usage: side-effect.mjs list|start|succeed|fail|reconcile');process.exit(64)}
console.log(JSON.stringify(cmd==='list'?s.sideEffects:(cmd==='start'?s.sideEffects.at(-1):s.sideEffects.find(x=>x.id===(a.id||a._[1]))),null,2));
