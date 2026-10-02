import crypto from 'node:crypto';
import {repositoryIdentity} from './identity.mjs';
import {validateContract} from './schema.mjs';

const iso=()=>new Date().toISOString();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const randomId=prefix=>`${prefix}-${crypto.randomUUID()}`;

function principal(root){
  const identity=repositoryIdentity(root);
  if(process.env.GITHUB_ACTIONS==='true'&&process.env.GITHUB_RUN_ID&&process.env.GITHUB_JOB){
    const seed=`${identity.repository.id}:${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_JOB}`;
    return {principalId:`ci:${hash(seed)}`,principalClass:'ci-runtime'};
  }
  return {principalId:`local-runtime:${identity.worktree.id}`,principalClass:'local-runtime'};
}

export function issueRuntimeExecution(root,state,{roleId='runtime-command',capabilities=[],ownershipScope=[],parentExecutionId=null}={}){
  const identity=repositoryIdentity(root),actor=principal(root),issuedAt=iso();
  const unsigned={
    executionId:randomId('EXEC'),
    ...actor,
    roleId,
    missionId:state.mission?.id||'NO_ACTIVE_MISSION',
    issuedAt,
    repositoryId:identity.repository.id,
    worktreeId:identity.worktree.id,
    capabilities:[...new Set(capabilities)].sort(),
    ownershipScope:[...new Set(ownershipScope)].sort(),
    parentExecutionId,
  };
  const execution={...unsigned,provenanceHash:hash(JSON.stringify(unsigned))};
  validateContract(root,'execution-record',execution);state.executions.push(execution);return execution;
}

export function executionById(state,id){return state.executions.find(item=>item.executionId===id)||null}

export function isIndependentTrustedReviewer(execution,implementationExecutions=[]){
  if(!execution||!['host-agent','human'].includes(execution.principalClass))return false;
  return !implementationExecutions.some(item=>item.principalId===execution.principalId||item.executionId===execution.executionId);
}
