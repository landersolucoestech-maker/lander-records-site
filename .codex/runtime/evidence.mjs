#!/usr/bin/env node
import path from 'node:path';import {normalizedState,saveState,uid,argMap,workspaceFingerprint,root,cdir,readJson} from './lib/core.mjs';
const a=argMap(),cmd=a._[0]||'list',s=normalizedState(),r=root(),reg=readJson(path.join(cdir(r),'agents','registry.json'),{}).agents||[];
if(cmd==='record'){
 const criterionId=a.criterion||a.criterionId,result=String(a.result||'').toUpperCase(),producer=a.producer,kind=a.kind||'manual-verification';
 if(!criterionId||!producer||!['PASS','FAIL','BLOCKED'].includes(result)){console.error('--criterion --producer --result PASS|FAIL|BLOCKED required');process.exit(64)}
 if(!s.criteria.some(c=>c.id===criterionId)){console.error('unknown criterion');process.exit(65)}
 if(!reg.some(x=>x.name===producer)&&!producer.startsWith('human:')){console.error('unknown evidence producer');process.exit(65)}
 const fp=workspaceFingerprint().fingerprint;s.evidence.push({id:a.id||uid('EV'),criterionId,kind,result,producer,command:a.command||null,exitCode:a.exitCode!==undefined?Number(a.exitCode):null,workspaceFingerprint:a.static?null:fp,invalidatesOnChange:a.static?false:true,timestamp:new Date().toISOString()});saveState(s);
}else if(cmd!=='list'){console.error('Usage: evidence.mjs list|record');process.exit(64)}
console.log(JSON.stringify(cmd==='list'?s.evidence:s.evidence.at(-1),null,2));
