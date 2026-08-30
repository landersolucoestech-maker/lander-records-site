#!/usr/bin/env node
import {spawnSync,execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,cdir} from './lib/core.mjs';
const r=root(),c=cdir(r),sep=process.argv.indexOf('--'),args=sep>=0?process.argv.slice(sep+1):process.argv.slice(2);
if(!args.length){console.error('Usage: node .codex/runtime/safe-exec.mjs -- <command> [args...]');process.exit(64)}
const guardian=path.join(c,'runtime','localhost-guardian.mjs');
function guard(stage){
 try{const out=JSON.parse(execFileSync(process.execPath,[guardian,stage==='before'?'daemon':'status','--quiet'],{cwd:r,encoding:'utf8'}));const health=stage==='before'?(out.health?.probe||out.health||out):out;if(health.ok===false||health.degraded){console.error(JSON.stringify({stage,localhost:'UNHEALTHY',health},null,2));return false}return true}catch(e){console.error(`[safe-exec] localhost guard failed (${stage}): ${e.stdout?.toString()||e.message}`);return false}
}
if(!guard('before'))process.exit(70);
const p=spawnSync(args[0],args.slice(1),{cwd:r,stdio:'inherit',shell:false,env:{...process.env}});
const commandStatus=p.status??1;
if(!guard('after'))process.exit(71);
process.exit(commandStatus);
