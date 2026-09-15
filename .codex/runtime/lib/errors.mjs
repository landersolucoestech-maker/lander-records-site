export const ERROR_EXIT_CODES=Object.freeze({
  STATE_NOT_FOUND:66,
  STATE_CORRUPT:65,
  STATE_SCHEMA_INVALID:65,
  STATE_VERSION_UNSUPPORTED:65,
  STATE_IDENTITY_MISMATCH:77,
  BLOCKED_BY_PERMISSION:77,
  IO_FAILURE:74,
  COMMIT_DURABILITY_UNCERTAIN:75,
  LOCK_TIMEOUT:75,
  REVISION_CONFLICT:75,
  POLICY_BLOCKED:77,
  UNSUPPORTED_BY_HOST:78,
});

export class EngineeringOSError extends Error{
  constructor(code,message,details={},cause){
    super(message,{cause});
    this.name='EngineeringOSError';
    this.code=code;
    this.details=details;
    this.exitCode=ERROR_EXIT_CODES[code]??1;
  }
  toJSON(){return {status:'BLOCKED',code:this.code,message:this.message,details:this.details}}
}

export function classifyIoError(error,operation,file){
  if(error instanceof EngineeringOSError)return error;
  if(error?.code==='ENOENT')return new EngineeringOSError('STATE_NOT_FOUND',`${operation}: file not found`,{file},error);
  if(error?.code==='EACCES'||error?.code==='EPERM')return new EngineeringOSError('BLOCKED_BY_PERMISSION',`${operation}: permission denied`,{file,osCode:error.code},error);
  return new EngineeringOSError('IO_FAILURE',`${operation}: ${error?.message||'I/O failure'}`,{file,osCode:error?.code||null},error);
}

export function failClosed(error){
  const safe=error instanceof EngineeringOSError?error:new EngineeringOSError('IO_FAILURE',error?.message||'Unknown runtime failure',{},error);
  console.error(JSON.stringify(safe.toJSON(),null,2));
  process.exit(safe.exitCode);
}
