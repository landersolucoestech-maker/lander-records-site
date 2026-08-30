#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {root,cdir,argMap,readJson,writeJson,uid} from './lib/core.mjs';
const a=argMap(),cmd=a._[0]||'status',file=path.join(cdir(root()),'state','ownership.json'),state=readJson(file,{schemaVersion:1,leases:[]});
const norm=x=>String(x).replace(/\\/g,'/').replace(/\/\*\*?$/,'').replace(/\/$/,'');const overlap=(a,b)=>{a=norm(a);b=norm(b);return a===b||a.startsWith(b+'/')||b.startsWith(a+'/')};
if(cmd==='acquire'){const owner=a.owner,paths=String(a.paths||'').split(',').map(x=>x.trim()).filter(Boolean);if(!owner||!paths.length){console.error('--owner --paths a,b required');process.exit(64)}for(const l of state.leases.filter(x=>x.status==='ACTIVE'&&x.owner!==owner))for(const p of paths)for(const q of l.paths)if(overlap(p,q)){console.error(JSON.stringify({status:'BLOCKED',conflict:l,path:p}));process.exit(2)}state.leases.push({id:a.id||uid('LEASE'),owner,paths,status:'ACTIVE',acquiredAt:new Date().toISOString()});writeJson(file,state)}
else if(cmd==='release'){const id=a.id,owner=a.owner;for(const l of state.leases)if(l.status==='ACTIVE'&&((id&&l.id===id)||(owner&&l.owner===owner))){l.status='RELEASED';l.releasedAt=new Date().toISOString()}writeJson(file,state)}
else if(cmd!=='status'){console.error('Usage: ownership.mjs status|acquire|release');process.exit(64)}
console.log(JSON.stringify(state,null,2));
