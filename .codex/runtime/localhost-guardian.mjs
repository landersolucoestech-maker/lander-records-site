#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root, cdir, readJson, writeJson} from './lib/core.mjs';

const projectRoot = root();
const codexDir = cdir(projectRoot);
const stateDir = path.join(codexDir, 'state');
const stateFile = path.join(stateDir, 'localhost-guardian-state.json');
const configFile = path.join(codexDir, 'localhost-guardian.json');
const logFile = path.join(stateDir, 'localhost-guardian.log');
const watcherPidFile = path.join(stateDir, 'localhost-guardian.pid');
const childPidFile = path.join(stateDir, 'localhost-devserver.pid');
const lockDir = path.join(stateDir, 'localhost-guardian-recovery.lock');
const guardianScript = fileURLToPath(import.meta.url);
fs.mkdirSync(stateDir, {recursive:true});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();
const argValue = name => {
  const i=process.argv.indexOf(name);
  return i>=0&&process.argv[i+1]?process.argv[i+1]:null;
};
const normalizePath = value => path.resolve(String(value||'')).replace(/\\/g,'/').toLowerCase();
const commandHash = cfg => crypto.createHash('sha256').update(`${normalizePath(cfg.cwd)}\0${cfg.command||''}`).digest('hex');
const ownershipToken = () => crypto.randomBytes(24).toString('hex');
const log = (event, data={}) => {
  const line = JSON.stringify({ts:now(), event, ...data});
  try{if(fs.existsSync(logFile)&&fs.statSync(logFile).size>2*1024*1024)fs.renameSync(logFile,logFile+'.1')}catch{}
  fs.appendFileSync(logFile, line+'\n');
  if (!process.argv.includes('--quiet')) process.stderr.write(`[localhost-guardian] ${event}${Object.keys(data).length?' '+JSON.stringify(data):''}\n`);
};

function pidAlive(pid){
  if(!Number.isInteger(pid) || pid <= 0) return false;
  try{ process.kill(pid,0); return true; }catch{ return false; }
}
function readPid(file){ try{return Number(fs.readFileSync(file,'utf8').trim())||null}catch{return null} }
function saveState(patch){ const s=readJson(stateFile,{schemaVersion:1}); writeJson(stateFile,{...s,...patch,updatedAt:now()}); }
function parsePortFromText(s){
  if(!s) return null;
  const pats=[/--port(?:=|\s+)(\d{2,5})/i,/\bPORT=(\d{2,5})\b/i,/:(\d{2,5})(?:\b|\/)/];
  for(const p of pats){const m=String(s).match(p);if(m){const n=Number(m[1]);if(n>0&&n<65536)return n;}}
  return null;
}
function packageManager(){
  if(fs.existsSync(path.join(projectRoot,'pnpm-lock.yaml'))) return 'pnpm';
  if(fs.existsSync(path.join(projectRoot,'yarn.lock'))) return 'yarn';
  return 'npm';
}
function packageCommand(pkg, allowStart=false){
  if(!pkg?.scripts) return null;
  const pm=packageManager();
  const prefix=k=>pm==='npm'?`npm run ${k}`:`${pm} ${k}`;
  for(const key of ['dev','start:dev','serve']) if(pkg.scripts[key]) return prefix(key);
  if(allowStart && pkg.scripts.start) return prefix('start');
  return null;
}
function detectDefaults(){
  const pkg=readJson(path.join(projectRoot,'package.json'),null);
  const deps={...(pkg?.dependencies||{}),...(pkg?.devDependencies||{})};
  const knownWeb=!!(deps.vite||deps.next||deps.nuxt||deps.astro||deps['@angular/core']||deps['webpack-dev-server']);
  const script=packageCommand(pkg,knownWeb);
  let scriptBody=null;
  if(script&&pkg?.scripts){const key=script.replace(/^npm run /,'').replace(/^pnpm /,'').replace(/^yarn /,'');scriptBody=pkg.scripts[key]}
  const scriptPort=parsePortFromText(scriptBody);
  if(scriptPort) return {command:script, port:scriptPort, reason:'package-script-port'};
  if(deps.vite) return {command:script||packageCommand(pkg,true),port:5173,reason:'vite'};
  if(deps.next) return {command:script||packageCommand(pkg,true),port:3000,reason:'next'};
  if(deps.nuxt) return {command:script||packageCommand(pkg,true),port:3000,reason:'nuxt'};
  if(deps.astro) return {command:script||packageCommand(pkg,true),port:4321,reason:'astro'};
  if(deps['@angular/core']) return {command:script||packageCommand(pkg,true),port:4200,reason:'angular'};
  if(deps['webpack-dev-server']) return {command:script||packageCommand(pkg,true),port:8080,reason:'webpack-dev-server'};
  if(script) return {command:script,port:3000,reason:'generic-package-dev'};
  if(fs.existsSync(path.join(projectRoot,'manage.py'))) return {command:'python manage.py runserver 127.0.0.1:8000',port:8000,reason:'django'};
  return {command:null,port:null,reason:'none'};
}
function config(){
  const user=readJson(configFile,{});
  const detected=detectDefaults();
  const envPort=Number(process.env.PORT||0)||null;
  const port=Number(user.port||envPort||detected.port||0)||null;
  const host=user.host||'127.0.0.1';
  const protocol=user.protocol||'http';
  const healthPath=user.healthPath||'/';
  return {
    enabled:user.enabled!==false && !!(user.command||detected.command||user.url||user.port),
    required:user.required!==false,
    command:user.command||detected.command,
    cwd:path.resolve(projectRoot,user.cwd||'.'),
    host, port, protocol, healthPath,
    url:user.url || (port?`${protocol}://${host}:${port}${healthPath}`:null),
    probe:user.probe||'http',
    intervalMs:Math.max(500,Number(user.intervalMs||2000)),
    startupTimeoutMs:Math.max(1000,Number(user.startupTimeoutMs||60000)),
    restartBackoffMs:Math.max(250,Number(user.restartBackoffMs||1000)),
    restartBackoffMaxMs:Math.max(1000,Number(user.restartBackoffMaxMs||15000)),
    stableResetMs:Math.max(1000,Number(user.stableResetMs||30000)),
    detectedReason:detected.reason
  };
}
async function tcpProbe(cfg){
  if(!cfg.port) return {ok:false,detail:'port-unresolved'};
  return await new Promise(resolve=>{
    const s=net.createConnection({host:cfg.host,port:cfg.port});
    const done=(ok,detail)=>{s.destroy();resolve({ok,detail});};
    s.setTimeout(1200);
    s.once('connect',()=>done(true,'tcp-connect'));
    s.once('timeout',()=>done(false,'tcp-timeout'));
    s.once('error',e=>done(false,e.code||e.message));
  });
}
async function httpProbe(cfg){
  if(!cfg.url) return {ok:false,detail:'url-unresolved'};
  return await new Promise(resolve=>{
    const mod=cfg.url.startsWith('https:')?https:http;
    const req=mod.get(cfg.url,{timeout:1800},res=>{res.resume();resolve({ok:res.statusCode>=200&&res.statusCode<300,detail:`http-${res.statusCode}`});});
    req.once('timeout',()=>{req.destroy();resolve({ok:false,detail:'http-timeout'});});
    req.once('error',e=>resolve({ok:false,detail:e.code||e.message}));
  });
}
async function probe(cfg=config()){
  if(!cfg.enabled) return {ok:true,skipped:true,detail:'guardian-disabled-or-no-dev-command',cfg};
  const result=cfg.probe==='tcp'?await tcpProbe(cfg):await httpProbe(cfg);
  if(!result.ok && cfg.probe==='http'){
    const tcp=await tcpProbe(cfg);
    if(tcp.ok) return {...tcp,ok:true,degraded:true,detail:`http-failed:${result.detail};tcp-ok`,cfg};
  }
  return {...result,cfg};
}
function spawnServer(cfg){
  if(!cfg.command) throw new Error('No localhost command resolved. Configure .codex/localhost-guardian.json');
  const token=ownershipToken(),hash=commandHash(cfg);
  const child=spawn(process.execPath,[guardianScript,'serve','--ownership-token',token,'--command-hash',hash],{
    cwd:projectRoot,detached:process.platform!=='win32',stdio:'ignore',env:{...process.env,CODEX_PROJECT_DIR:projectRoot}
  });
  child.unref();
  fs.writeFileSync(childPidFile,String(child.pid));
  saveState({status:'STARTING',childPid:child.pid,childOwnershipToken:token,childCommandHash:hash,projectRoot:normalizePath(projectRoot),command:cfg.command,port:cfg.port,url:cfg.url,lastStartAt:now()});
  log('server-spawned',{pid:child.pid,command:cfg.command,port:cfg.port});
  return child.pid;
}
async function serveOwnedServer(){
  const cfg=config(),token=argValue('--ownership-token'),hash=argValue('--command-hash');
  if(!token||!/^[a-f0-9]{48}$/.test(token)||hash!==commandHash(cfg)) throw new Error('invalid guardian child ownership credentials');
  const child=process.platform==='win32'
    ? spawn(cfg.command,{cwd:cfg.cwd,shell:true,detached:false,stdio:['ignore','ignore','ignore'],env:{...process.env}})
    : spawn('/bin/sh',['-lc',`exec ${cfg.command}`],{cwd:cfg.cwd,detached:false,stdio:['ignore','ignore','ignore'],env:{...process.env}});
  const forward=signal=>{try{if(process.platform==='win32')killPid(child.pid);else child.kill(signal)}catch{}};
  process.on('SIGTERM',()=>forward('SIGTERM'));
  process.on('SIGINT',()=>forward('SIGINT'));
  const code=await new Promise(resolve=>{child.once('exit',c=>resolve(Number.isInteger(c)?c:1));child.once('error',()=>resolve(1));});
  process.exit(code);
}
function killPid(pid){
  if(!pidAlive(pid)) return;
  try{
    if(process.platform==='win32') execFileSync('taskkill',['/PID',String(pid),'/T','/F'],{stdio:'ignore'});
    else process.kill(-pid,'SIGTERM');
  }catch{try{process.kill(pid,'SIGTERM')}catch{}}
}
function processCommandLine(pid){
  if(!pidAlive(pid)) return null;
  if(process.platform==='linux'){
    try{return fs.readFileSync(`/proc/${pid}/cmdline`,'utf8').replace(/\0/g,' ').trim()||null}catch{return null}
  }
  if(process.platform==='win32'){
    try{
      const escaped=String(pid).replace(/[^0-9]/g,'');
      return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`(Get-CimInstance Win32_Process -Filter "ProcessId = ${escaped}").CommandLine`],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null;
    }catch{return null}
  }
  return null;
}
function commandLineContains(commandLine,expected){
  const haystack=String(commandLine||'').replace(/\\/g,'/').replace(/\s+/g,' ').toLowerCase();
  const needle=String(expected||'').replace(/\\/g,'/').replace(/\s+/g,' ').trim().toLowerCase();
  return !!needle&&haystack.includes(needle);
}
function guardianCommandLine(pid,mode,token){
  const cmd=processCommandLine(pid);
  return commandLineContains(cmd,normalizePath(guardianScript))&&commandLineContains(cmd,mode)&&commandLineContains(cmd,token);
}
async function acquireRecoveryLock(cfg){
  const deadline=Date.now()+cfg.startupTimeoutMs;
  while(Date.now()<deadline){
    try{fs.mkdirSync(lockDir);fs.writeFileSync(path.join(lockDir,'owner.json'),JSON.stringify({pid:process.pid,at:now()}));return true}catch(e){
      if(e.code!=='EEXIST') throw e;
      try{const age=Date.now()-fs.statSync(lockDir).mtimeMs;if(age>cfg.startupTimeoutMs*2)fs.rmSync(lockDir,{recursive:true,force:true})}catch{}
      const p=await probe(cfg);if(p.ok)return false;await sleep(150);
    }
  }
  throw new Error('localhost recovery lock timeout');
}
function releaseRecoveryLock(){try{fs.rmSync(lockDir,{recursive:true,force:true})}catch{}}
function guardianOwnsChild(pid,cfg){
  const st=readJson(stateFile,{});
  const token=st.childOwnershipToken,hash=st.childCommandHash;
  if(!pid||st.childPid!==pid||st.command!==cfg.command||st.projectRoot!==normalizePath(projectRoot))return false;
  if(!token||!/^[a-f0-9]{48}$/.test(token)||hash!==commandHash(cfg))return false;
  return guardianCommandLine(pid,'serve',token)&&commandLineContains(processCommandLine(pid),hash);
}
function guardianOwnsWatcher(pid){
  const st=readJson(stateFile,{}),token=st.watcherOwnershipToken;
  if(!pid||!pidAlive(pid))return false;
  if(readPid(watcherPidFile)!==pid||st.watcherPid!==pid||st.projectRoot!==normalizePath(projectRoot))return false;
  return !!token&&/^[a-f0-9]{48}$/.test(token)&&guardianCommandLine(pid,'watch',token);
}
function guardianOwnsLegacyWatcher(pid){
  const st=readJson(stateFile,{}),cmd=processCommandLine(pid);
  return !!pid&&pidAlive(pid)&&readPid(watcherPidFile)===pid&&st.watcherPid===pid&&!st.watcherOwnershipToken&&
    commandLineContains(cmd,normalizePath(guardianScript))&&commandLineContains(cmd,'watch');
}
async function ensureHealthy(cfg=config(), opts={}){
  const first=await probe(cfg);
  if(first.ok){saveState({status:first.degraded?'DEGRADED':'HEALTHY',lastHealthyAt:now(),port:cfg.port,url:cfg.url,degraded:!!first.degraded});return {ok:true,action:'already-healthy',probe:first};}
  if(!cfg.command){saveState({status:'FAILED',lastFailureAt:now(),failure:'unhealthy-and-no-recovery-command'});return {ok:false,action:'no-recovery-command',probe:first};}
  const locked=await acquireRecoveryLock(cfg);
  if(!locked){const p=await probe(cfg);return {ok:p.ok,action:'recovered-by-peer',probe:p};}
  try{
    const again=await probe(cfg);if(again.ok)return {ok:true,action:'recovered-before-spawn',probe:again};
    const childPid=readPid(childPidFile);
    if(childPidAliveButUnhealthy(childPid) && guardianOwnsChild(childPid,cfg)){
      log('unhealthy-existing-owned-child',{pid:childPid,detail:again.detail});
      killPid(childPid); await sleep(300);
    } else if(childPidAliveButUnhealthy(childPid)) {
      log('refused-to-kill-unverified-pid',{pid:childPid});
      return {ok:false,action:'unverified-existing-process',probe:again};
    }
    spawnServer(cfg);
    const deadline=Date.now()+cfg.startupTimeoutMs;let last=again;
    while(Date.now()<deadline){ await sleep(500); last=await probe(cfg); if(last.ok){saveState({status:last.degraded?'DEGRADED':'HEALTHY',lastHealthyAt:now(),port:cfg.port,url:cfg.url,degraded:!!last.degraded});log('server-healthy',{detail:last.detail,degraded:!!last.degraded});return {ok:true,action:'started',probe:last};} }
    saveState({status:'FAILED',lastFailureAt:now(),failure:last.detail});return {ok:false,action:'start-timeout',probe:last};
  } finally {releaseRecoveryLock();}
}
function childPidAliveButUnhealthy(pid){ return !!pid && pidAlive(pid); }
async function watch(){
  const cfg=config();
  const token=argValue('--ownership-token');
  if(!token||!/^[a-f0-9]{48}$/.test(token))throw new Error('watch requires a valid ownership token');
  fs.writeFileSync(watcherPidFile,String(process.pid));
  saveState({status:'WATCHING',watcherPid:process.pid,watcherOwnershipToken:token,projectRoot:normalizePath(projectRoot),command:cfg.command,port:cfg.port,url:cfg.url});
  let failures=0, stableSince=0;
  const cleanup=()=>{try{fs.unlinkSync(watcherPidFile)}catch{}; saveState({watcherPid:null});};
  process.on('SIGTERM',()=>{cleanup();process.exit(0)}); process.on('SIGINT',()=>{cleanup();process.exit(0)}); process.on('exit',cleanup);
  log('watcher-started',{pid:process.pid,port:cfg.port,reason:cfg.detectedReason});
  while(true){
    const p=await probe(cfg);
    if(p.ok){
      if(!stableSince) stableSince=Date.now();
      if(Date.now()-stableSince>=cfg.stableResetMs) failures=0;
      saveState({status:p.degraded?'DEGRADED':'HEALTHY',lastHealthyAt:now(),watcherPid:process.pid,port:cfg.port,url:cfg.url,degraded:!!p.degraded});
      await sleep(cfg.intervalMs); continue;
    }
    stableSince=0; failures++;
    saveState({status:'RECOVERING',lastFailureAt:now(),failure:p.detail,restartCount:failures});
    log('health-lost',{detail:p.detail,restartCount:failures});
    const backoff=Math.min(cfg.restartBackoffMaxMs,cfg.restartBackoffMs*Math.pow(2,Math.min(failures-1,6)));
    await sleep(backoff);
    const r=await ensureHealthy(cfg);
    if(!r.ok) log('recovery-failed',{detail:r.probe?.detail,restartCount:failures}); else log('recovered',{restartCount:failures});
  }
}
function startDaemon(){
  const cfg=config();
  if(!cfg.enabled) return {ok:true,skipped:true,action:'no-dev-server-detected'};
  const existing=readPid(watcherPidFile);
  if(guardianOwnsWatcher(existing)) return {ok:true,action:'watcher-already-running',pid:existing};
  if(guardianOwnsLegacyWatcher(existing)){log('legacy-watcher-upgrade',{pid:existing});killPid(existing);}
  else if(existing&&pidAlive(existing)){log('stale-watcher-pid-refused',{pid:existing});return {ok:false,action:'unverified-existing-watcher',pid:existing};}
  const token=ownershipToken();
  const child=spawn(process.execPath,[guardianScript,'watch','--quiet','--ownership-token',token],{cwd:projectRoot,detached:true,stdio:'ignore',env:{...process.env,CODEX_PROJECT_DIR:projectRoot}});
  child.unref();
  fs.writeFileSync(watcherPidFile,String(child.pid));
  saveState({watcherPid:child.pid,watcherOwnershipToken:token,projectRoot:normalizePath(projectRoot)});
  return {ok:true,action:'watcher-started',pid:child.pid};
}
async function stop(){
  const watcher=readPid(watcherPidFile), child=readPid(childPidFile);
  if(guardianOwnsWatcher(watcher)) killPid(watcher); else if(watcher&&pidAlive(watcher)) log('refused-to-stop-unverified-watcher',{pid:watcher});
  if(guardianOwnsChild(child,config())) killPid(child); else if(child&&pidAlive(child)) log('refused-to-stop-unverified-child',{pid:child});
  for(const f of [watcherPidFile,childPidFile]) try{fs.unlinkSync(f)}catch{}
  saveState({status:'STOPPED',watcherPid:null,childPid:null});
  return {ok:true,action:'stopped'};
}

const cmd=process.argv[2]||'status';
let out;
if(cmd==='status') out=await probe();
else if(cmd==='ensure') out=await ensureHealthy();
else if(cmd==='serve'){await serveOwnedServer();process.exit(0)}
else if(cmd==='watch'){await watch(); process.exit(0)}
else if(cmd==='daemon'){const cfg=config(); if(!cfg.enabled) out={ok:true,skipped:true,action:'no-dev-server-detected'}; else {const health=await ensureHealthy(cfg); const daemon=health.ok?startDaemon():{ok:false,action:'watcher-not-started'}; out={...daemon,health};}}
else if(cmd==='stop') out=await stop();
else if(cmd==='config') out=config();
else {console.error('Usage: localhost-guardian.mjs status|ensure|serve|watch|daemon|stop|config');process.exit(64)}
console.log(JSON.stringify(out,null,2));
process.exit(out?.ok===false?2:0);
