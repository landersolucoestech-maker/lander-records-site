#!/usr/bin/env node
import {normalizedState,saveState,uid,argMap} from './lib/core.mjs';
const a=argMap(),cmd=a._[0]||'list',s=normalizedState();
if(cmd==='record'){const severity=String(a.severity||'MEDIUM').toUpperCase(),summary=a.summary||a._.slice(1).join(' '),producer=a.producer;if(!summary||!producer||!['INFO','LOW','MEDIUM','HIGH','CRITICAL','BLOCKER'].includes(severity)){console.error('invalid finding');process.exit(64)}s.findings.push({id:a.id||uid('FIND'),severity,status:'OPEN',summary,producer,createdAt:new Date().toISOString()});saveState(s)}
else if(cmd==='resolve'||cmd==='waive'){const id=a.id||a._[1],f=s.findings.find(x=>x.id===id);if(!f){console.error('unknown finding');process.exit(65)}f.status=cmd==='resolve'?'RESOLVED':'WAIVED';f.resolution=a.reason||null;f.updatedAt=new Date().toISOString();saveState(s)}
else if(cmd!=='list'){console.error('Usage: finding.mjs list|record|resolve|waive');process.exit(64)}
console.log(JSON.stringify(cmd==='list'?s.findings:(cmd==='record'?s.findings.at(-1):s.findings.find(x=>x.id===(a.id||a._[1]))),null,2));
