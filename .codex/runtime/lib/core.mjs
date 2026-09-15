import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {StateStore,atomicWrite,withLock} from './store.mjs';
import {EngineeringOSError} from './errors.mjs';
export const root=()=>path.resolve(process.env.CODEX_PROJECT_DIR||process.cwd());
export const cdir=(r=root())=>path.join(r,'.codex');
export const readJson=(p,f=null)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return f}};
export const writeJson=(p,v)=>withLock(p,()=>atomicWrite(p,v));
const sh=(args,r,{optional=false}={})=>{try{return execFileSync('git',args,{cwd:r,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}catch(error){if(optional)return'';throw new EngineeringOSError('IO_FAILURE',`Git command failed while computing workspace identity: git ${args.join(' ')}`,{cwd:r,stderr:String(error.stderr||'').trim()},error)}};
export function workspaceFingerprint(r=root()){
 const head=sh(['rev-parse','HEAD'],r,{optional:true})||'NO_HEAD',branch=sh(['branch','--show-current'],r)||'DETACHED';
 const ps=['--','.',' :(exclude).codex/state/**'.trim(),' :(exclude).codex/project-profile.json'.trim()];
 const staged=sh(['diff','--cached','--binary',...ps],r),unstaged=sh(['diff','--binary',...ps],r),untracked=sh(['ls-files','--others','--exclude-standard','-z','--','.',' :(exclude).codex/state/**'.trim(),' :(exclude).codex/project-profile.json'.trim()],r).split('\0').filter(Boolean).sort();
 const h=crypto.createHash('sha256');h.update(head+'\0'+branch+'\0'+staged+'\0'+unstaged);
 for(const f of untracked){h.update('\0'+f+'\0');try{h.update(fs.readFileSync(path.join(r,f)))}catch(error){throw new EngineeringOSError(error?.code==='EACCES'||error?.code==='EPERM'?'BLOCKED_BY_PERMISSION':'IO_FAILURE',`Cannot fingerprint untracked file: ${f}`,{file:f},error)}}
 return {fingerprint:h.digest('hex'),head,branch,untrackedCount:untracked.length};
}
export function statePath(r=root()){return new StateStore(r).file}
export function loadState(r=root()){return new StateStore(r).read()}
export function saveState(s,r=root()){return new StateStore(r).transaction(draft=>{for(const key of Object.keys(draft))delete draft[key];Object.assign(draft,structuredClone(s))},{expectedRevision:s.revision}).state}
export function walk(dir,ignore=new Set(['.git','node_modules','vendor','dist','build','.next','.turbo'])){const out=[];if(!fs.existsSync(dir))return out;const rec=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignore.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())rec(p);else if(e.isFile())out.push(p)}};rec(dir);return out}
export const uid=(prefix='ID')=>`${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
export function argMap(argv=process.argv.slice(2)){const out={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--'){out._.push(...argv.slice(i+1));break}if(a.startsWith('--')){const k=a.slice(2);const v=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;out[k]=v}else out._.push(a)}return out}
export function normalizedState(r=root()){return loadState(r)}
export {StateStore} from './store.mjs';
export {repositoryIdentity,identityMatches,identityDigest} from './identity.mjs';
export {validateContract} from './schema.mjs';
export {EngineeringOSError,failClosed} from './errors.mjs';
