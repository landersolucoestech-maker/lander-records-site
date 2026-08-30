#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,cdir,readJson,workspaceFingerprint,writeJson} from './lib/core.mjs';
const r=root(),c=cdir(r);const checks=[];
const run=(name,args,required=true)=>{try{const raw=execFileSync(process.execPath,args,{cwd:r,encoding:'utf8'});checks.push({name,ok:true,result:JSON.parse(raw)});return true}catch(e){checks.push({name,ok:false,detail:e.stdout?.toString()||e.message});return !required}};
run('doctor',[path.join(c,'runtime','doctor.mjs')]);
const guardianCfg=readJson(path.join(c,'localhost-guardian.json'),{});
if(guardianCfg.required!==false){
  try{const raw=execFileSync(process.execPath,[path.join(c,'runtime','localhost-guardian.mjs'),'daemon','--quiet'],{cwd:r,encoding:'utf8'});const result=JSON.parse(raw);const degraded=!!result.health?.probe?.degraded;checks.push({name:'localhost-guardian',ok:result.ok!==false&&!degraded,result,detail:degraded?'degraded-health':''});}
  catch(e){checks.push({name:'localhost-guardian',ok:false,detail:e.stdout?.toString()||e.message});}
}
const fp=workspaceFingerprint(r);writeJson(path.join(c,'state','preflight.json'),{schemaVersion:1,at:new Date().toISOString(),workspaceFingerprint:fp.fingerprint,checks});
const bad=checks.filter(x=>!x.ok);console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',workspaceFingerprint:fp.fingerprint,checks},null,2));process.exit(bad.length?2:0);
