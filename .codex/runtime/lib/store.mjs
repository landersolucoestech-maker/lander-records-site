import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {EngineeringOSError,classifyIoError} from './errors.mjs';
import {repositoryIdentity,identityMatches} from './identity.mjs';
import {validateContract} from './schema.mjs';

const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const iso=()=>new Date().toISOString();
const canonical=value=>JSON.stringify(value,Object.keys(value).sort());
const digest=value=>crypto.createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:canonical(value)).digest('hex');
const stateWithoutChecksum=state=>{const copy=structuredClone(state);delete copy.checksum;return copy};
export const stateChecksum=state=>digest(JSON.stringify(stateWithoutChecksum(state)));

function resolvedPhysicalPath(target){
  const missing=[];let cursor=path.resolve(target);
  while(!fs.existsSync(cursor)){
    const parent=path.dirname(cursor);if(parent===cursor)break;
    missing.unshift(path.basename(cursor));cursor=parent;
  }
  return path.resolve(fs.realpathSync(cursor),...missing);
}

function pathInside(root,target){const relative=path.relative(root,target);return relative!==''&&!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith(`..${path.sep}`)}

export function authoritativeStatePath(root){
  const configFile=path.join(root,'.codex','state-location.json');let relative='.codex/state/run-state.json';
  try{const config=JSON.parse(fs.readFileSync(configFile,'utf8'));if(config?.schemaVersion!==1||typeof config.authoritativeState!=='string')throw new Error('invalid state-location contract');relative=config.authoritativeState}catch(error){if(error?.code!=='ENOENT')throw new EngineeringOSError('STATE_SCHEMA_INVALID','State location configuration is invalid',{configFile,error:error.message},error)}
  const rootPhysical=fs.realpathSync(path.resolve(root)),resolved=resolvedPhysicalPath(path.resolve(root,relative)),parts=path.relative(rootPhysical,resolved).split(path.sep);
  if(!pathInside(rootPhysical,resolved)||parts.includes('.git'))throw new EngineeringOSError('STATE_IDENTITY_MISMATCH','Authoritative state path escapes the worktree',{resolved,root:rootPhysical});return resolved;
}

function pidAlive(pid){if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true}catch(error){return error?.code==='EPERM'}}

function readOwner(lock){try{return JSON.parse(fs.readFileSync(path.join(lock,'owner.json'),'utf8'))}catch{return null}}

export function withLock(file,fn,{timeoutMs=10000,staleMs=60000}={}){
  const lock=`${file}.lock`,started=Date.now();fs.mkdirSync(path.dirname(file),{recursive:true});
  while(true){
    try{
      fs.mkdirSync(lock);
      fs.writeFileSync(path.join(lock,'owner.json'),JSON.stringify({pid:process.pid,createdAt:iso(),file}),{flag:'wx'});
      break;
    }catch(error){
      if(error?.code!=='EEXIST')throw classifyIoError(error,'acquire-lock',lock);
      const owner=readOwner(lock);let age=0;try{age=Date.now()-fs.statSync(lock).mtimeMs}catch{}
      if(age>staleMs&&(!owner||!pidAlive(Number(owner.pid)))){
        const stale=`${lock}.stale-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        try{fs.renameSync(lock,stale);fs.rmSync(stale,{recursive:true,force:true});continue}catch{}
      }
      if(Date.now()-started>=timeoutMs)throw new EngineeringOSError('LOCK_TIMEOUT','Timed out acquiring state lock',{file,lock,owner,ageMs:age});
      sleep(20);
    }
  }
  try{return fn()}finally{try{fs.rmSync(lock,{recursive:true,force:true})}catch{}}
}

function fsyncDirectory(directory){
  if(process.platform==='win32')return;
  const fd=fs.openSync(directory,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
}

export function atomicWrite(file,value,{backup=true,onPhase=null}={}){
  const directory=path.dirname(file);fs.mkdirSync(directory,{recursive:true});
  const temp=path.join(directory,`.${path.basename(file)}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`);
  let backupTemp=null,published=false;
  const payload=JSON.stringify(value,null,2)+'\n';
  try{
    const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,payload,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)};onPhase?.('temp-synced');
    if(backup&&fs.existsSync(file)){
      backupTemp=`${file}.bak.tmp-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
      fs.copyFileSync(file,backupTemp);const bfd=fs.openSync(backupTemp,process.platform==='win32'?'r+':'r');try{fs.fsyncSync(bfd)}finally{fs.closeSync(bfd)};onPhase?.('backup-synced');fs.renameSync(backupTemp,`${file}.bak`);backupTemp=null;onPhase?.('backup-renamed');
    }
    fs.renameSync(temp,file);published=true;onPhase?.('target-renamed');fsyncDirectory(directory);
  }catch(error){
    try{fs.rmSync(temp,{force:true})}catch{};if(backupTemp)try{fs.rmSync(backupTemp,{force:true})}catch{}
    if(published)throw new EngineeringOSError('COMMIT_DURABILITY_UNCERTAIN','atomic-write: target published but directory durability is unconfirmed',{file,osCode:error?.code||null,retrySafe:false},error);
    throw classifyIoError(error,'atomic-write',file)
  }
}

export function readJsonStrict(file){
  let text;try{text=fs.readFileSync(file,'utf8')}catch(error){throw classifyIoError(error,'read-json',file)}
  try{return JSON.parse(text)}catch(error){throw new EngineeringOSError('STATE_CORRUPT','JSON state is corrupt',{file,error:error.message,contentHash:digest(text)},error)}
}

export function createState(root,{branchPolicy='exact'}={}){
  const now=iso(),identity=repositoryIdentity(root);
  const state={schemaVersion:3,revision:0,identity:{...identity,branchPolicy},createdAt:now,updatedAt:now,mission:{status:'IDLE'},impact:null,requirements:[],criteria:[],executions:[],authorityGrants:[],evidence:[],reviews:[],findings:[],sideEffects:[],coverage:null,workflow:null,executionGraph:null,preflight:null};
  state.checksum=stateChecksum(state);validateContract(root,'run-state',state);return state;
}

export function validateState(root,state,{verifyIdentity=true,currentIdentity=null}={}){
  if(state?.schemaVersion!==3){
    const code=Number.isInteger(state?.schemaVersion)?'STATE_VERSION_UNSUPPORTED':'STATE_SCHEMA_INVALID';
    throw new EngineeringOSError(code,`Unsupported run-state schemaVersion: ${state?.schemaVersion}`,{supported:[3]});
  }
  validateContract(root,'run-state',state);
  if(state.coverage!==null)validateContract(root,'coverage-record',state.coverage);
  if(state.workflow!==null)validateContract(root,'workflow-ledger',state.workflow);
  if(state.preflight!==null&&state.preflight!==undefined)validateContract(root,'preflight-record',state.preflight);
  const expectedChecksum=stateChecksum(state);if(state.checksum!==expectedChecksum)throw new EngineeringOSError('STATE_CORRUPT','Run-state checksum mismatch',{expected:expectedChecksum,actual:state.checksum});
  if(verifyIdentity){const current=currentIdentity||repositoryIdentity(root),match=identityMatches(state.identity,current,{branchPolicy:state.identity.branchPolicy});if(!match.ok)throw new EngineeringOSError('STATE_IDENTITY_MISMATCH','Run-state belongs to another repository, worktree, or branch',{mismatches:match.mismatches,expected:state.identity,current})}
  return state;
}

export class StateStore{
  constructor(root,file=null){this.root=path.resolve(root);this.file=file?path.resolve(file):authoritativeStatePath(this.root)}
  revisionDirectory(){return `${this.file}.revisions`}
  revisionFile(revision){return path.join(this.revisionDirectory(),`${String(revision).padStart(16,'0')}.json`)}
  revisionFiles(){
    const directory=this.revisionDirectory();if(!fs.existsSync(directory))return[];
    return fs.readdirSync(directory).filter(name=>/^\d{16}\.json$/.test(name)).sort().map(name=>path.join(directory,name));
  }
  currentFile(){const revisions=this.revisionFiles();return revisions.at(-1)||this.file}
  exists(){return this.revisionFiles().length>0||fs.existsSync(this.file)}
  read(options={}){return validateState(this.root,readJsonStrict(this.currentFile()),options)}
  quarantine(reason='incompatible-state'){
    if(!this.exists())return null;const source=this.currentFile(),directory=path.join(path.dirname(this.file),'quarantine');fs.mkdirSync(directory,{recursive:true});
    const raw=fs.readFileSync(source),target=path.join(directory,`${path.basename(source)}.${Date.now()}.${digest(raw).slice(0,12)}.quarantine`);
    const metadata={schemaVersion:1,reason,source,target,sha256:digest(raw),quarantinedAt:iso()};
    fs.copyFileSync(source,target);atomicWrite(`${target}.metadata.json`,metadata,{backup:false});return metadata;
  }
  initialize({quarantineIncompatible=false,branchPolicy='exact'}={}){
    return withLock(this.file,()=>{
      if(this.exists()){
        try{return this.read()}
        catch(error){if(!quarantineIncompatible)throw error;this.quarantine(error.code||'incompatible-state')}
      }
      const state=createState(this.root,{branchPolicy});atomicWrite(this.revisionFile(0),state,{backup:false});return state;
    });
  }
  migrateAdditiveV3(){
    return withLock(this.file,()=>{
      const state=readJsonStrict(this.currentFile());
      if(state?.schemaVersion!==3)throw new EngineeringOSError('STATE_VERSION_UNSUPPORTED','Only schema v3 additive migration is supported',{actual:state?.schemaVersion});
      const expected=stateChecksum(state);if(state.checksum!==expected)throw new EngineeringOSError('STATE_CORRUPT','Refusing migration of state with invalid checksum',{expected,actual:state.checksum});
      const match=identityMatches(state.identity,repositoryIdentity(this.root),{branchPolicy:state.identity?.branchPolicy});if(!match.ok)throw new EngineeringOSError('STATE_IDENTITY_MISMATCH','Refusing migration of foreign state',{mismatches:match.mismatches});
      const allowedMissing=[];if(!Object.hasOwn(state,'preflight')){state.preflight=null;allowedMissing.push('preflight')}
      if(!allowedMissing.length)return state;
      state.revision+=1;state.updatedAt=iso();state.checksum=stateChecksum(state);validateState(this.root,state);
      const target=this.revisionFile(state.revision);if(fs.existsSync(target))throw new EngineeringOSError('REVISION_CONFLICT','Migration revision already exists',{target});atomicWrite(target,state,{backup:false});return state;
    });
  }
  transaction(mutator,{expectedRevision=null,timeoutMs=60000}={}){
    return withLock(this.file,()=>{
      const currentIdentity=repositoryIdentity(this.root),state=this.read({currentIdentity});if(expectedRevision!==null&&state.revision!==expectedRevision)throw new EngineeringOSError('REVISION_CONFLICT','State revision changed',{expectedRevision,actualRevision:state.revision});
      const before=state.revision,result=mutator(state);if(state.revision!==before)throw new EngineeringOSError('REVISION_CONFLICT','Mutator changed revision directly',{before,after:state.revision});
      state.revision=before+1;state.updatedAt=iso();state.checksum=stateChecksum(state);validateState(this.root,state,{currentIdentity});const target=this.revisionFile(state.revision);if(fs.existsSync(target))throw new EngineeringOSError('REVISION_CONFLICT','Target revision already exists',{target,revision:state.revision});atomicWrite(target,state,{backup:false});return {state,result};
    },{timeoutMs});
  }
  restoreBackup(){
    return withLock(this.file,()=>{const files=this.revisionFiles();if(files.length<2)throw new EngineeringOSError('STATE_NOT_FOUND','No previous state revision is available',{directory:this.revisionDirectory()});const current=validateState(this.root,readJsonStrict(files.at(-1))),candidate=validateState(this.root,readJsonStrict(files.at(-2)));candidate.revision=current.revision+1;candidate.updatedAt=iso();candidate.checksum=stateChecksum(candidate);validateState(this.root,candidate);atomicWrite(this.revisionFile(candidate.revision),candidate,{backup:false});return candidate});
  }
}
