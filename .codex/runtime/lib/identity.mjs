import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {EngineeringOSError} from './errors.mjs';

const normalizePath=value=>path.resolve(value).replace(/\\/g,'/').replace(/\/$/,'').toLowerCase();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const git=(root,args,{optional=false}={})=>{
  try{return execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}
  catch(error){if(optional)return null;throw new EngineeringOSError('IO_FAILURE',`Git identity command failed: git ${args.join(' ')}`,{root,stderr:String(error.stderr||'').trim()},error)}
};

export function repositoryIdentity(root){
  const repositoryRoot=normalizePath(git(root,['rev-parse','--show-toplevel']));
  const gitDirRaw=git(root,['rev-parse','--absolute-git-dir']);
  const commonRaw=git(root,['rev-parse','--git-common-dir']);
  const gitDir=normalizePath(path.isAbsolute(gitDirRaw)?gitDirRaw:path.join(repositoryRoot,gitDirRaw));
  const gitCommonDir=normalizePath(path.isAbsolute(commonRaw)?commonRaw:path.join(repositoryRoot,commonRaw));
  const origin=git(root,['remote','get-url','origin'],{optional:true});
  const branch=git(root,['branch','--show-current'])||'DETACHED';
  const head=git(root,['rev-parse','HEAD'],{optional:true})||'NO_HEAD';
  const repositoryKey=JSON.stringify({origin:origin||null,gitCommonDir});
  const worktreeKey=JSON.stringify({repositoryRoot,gitDir});
  return {
    repository:{id:hash(repositoryKey),root:repositoryRoot,origin:origin||null},
    gitCommonDir:{id:hash(gitCommonDir),path:gitCommonDir},
    worktree:{id:hash(worktreeKey),root:repositoryRoot,gitDir},
    branch,
    head,
  };
}

export function identityMatches(expected,current,{branchPolicy='exact'}={}){
  const mismatches=[];
  if(expected?.repository?.id!==current.repository.id)mismatches.push('repository');
  if(expected?.gitCommonDir?.id!==current.gitCommonDir.id)mismatches.push('git-common-dir');
  if(expected?.worktree?.id!==current.worktree.id)mismatches.push('worktree');
  if(branchPolicy==='exact'&&expected?.branch!==current.branch)mismatches.push('branch');
  return {ok:mismatches.length===0,mismatches};
}

export const identityDigest=identity=>hash(JSON.stringify(identity));
