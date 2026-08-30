import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
export const root=()=>path.resolve(process.env.CODEX_PROJECT_DIR||process.cwd());
export const cdir=(r=root())=>path.join(r,'.codex');
export const readJson=(p,f=null)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return f}};
export const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};
const sh=(args,r)=>{try{return execFileSync('git',args,{cwd:r,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{return''}};
export function workspaceFingerprint(r=root()){
 const head=sh(['rev-parse','HEAD'],r)||'NO_HEAD',branch=sh(['branch','--show-current'],r)||'DETACHED';
 const ps=['--','.',' :(exclude).codex/state/**'.trim(),' :(exclude).codex/project-profile.json'.trim()];
 const staged=sh(['diff','--cached','--binary',...ps],r),unstaged=sh(['diff','--binary',...ps],r),untracked=sh(['ls-files','--others','--exclude-standard','-z','--','.',' :(exclude).codex/state/**'.trim(),' :(exclude).codex/project-profile.json'.trim()],r).split('\0').filter(Boolean).sort();
 const h=crypto.createHash('sha256');h.update(head+'\0'+branch+'\0'+staged+'\0'+unstaged);
 for(const f of untracked){h.update('\0'+f+'\0');try{h.update(fs.readFileSync(path.join(r,f)))}catch{}}
 return {fingerprint:h.digest('hex'),head,branch,untrackedCount:untracked.length};
}
export function statePath(r=root()){return path.join(cdir(r),'state','run-state.json')}
export function loadState(r=root()){return readJson(statePath(r),{schemaVersion:2,mission:{status:'IDLE'},impact:null,requirements:[],criteria:[],evidence:[],reviews:[],findings:[],sideEffects:[]})}
export function saveState(s,r=root()){writeJson(statePath(r),s)}
export function walk(dir,ignore=new Set(['.git','node_modules','vendor','dist','build','.next','.turbo'])){const out=[];if(!fs.existsSync(dir))return out;const rec=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignore.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())rec(p);else if(e.isFile())out.push(p)}};rec(dir);return out}
export const uid=(prefix='ID')=>`${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
export function argMap(argv=process.argv.slice(2)){const out={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const k=a.slice(2);const v=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;out[k]=v}else out._.push(a)}return out}
export function normalizedState(r=root()){const s=loadState(r);for(const k of ['requirements','criteria','evidence','reviews','findings','sideEffects'])if(!Array.isArray(s[k]))s[k]=[];if(!s.mission)s.mission={status:'IDLE'};return s}
