import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {EngineeringOSError,classifyIoError} from './errors.mjs';

const cache=new Map();

export function contractPath(root,name){return path.join(root,'.codex','contracts',`${name}.schema.json`)}

export function loadContract(root,name){
  const key=`${root}:${name}`;if(cache.has(key))return cache.get(key);
  const file=contractPath(root,name);let schema;
  try{schema=JSON.parse(fs.readFileSync(file,'utf8'))}
  catch(error){if(error instanceof SyntaxError)throw new EngineeringOSError('STATE_SCHEMA_INVALID',`Contract JSON is corrupt: ${name}`,{file,error:error.message},error);throw classifyIoError(error,'load-contract',file)}
  let validate;try{const ajv=new Ajv2020({allErrors:true,strict:true,allowUnionTypes:true});addFormats(ajv);validate=ajv.compile(schema)}catch(error){throw new EngineeringOSError('STATE_SCHEMA_INVALID',`Contract cannot be compiled: ${name}`,{file,error:error.message},error)}
  cache.set(key,validate);return validate;
}

export function validateContract(root,name,value,{code='STATE_SCHEMA_INVALID'}={}){
  const validate=loadContract(root,name);if(validate(value))return value;
  throw new EngineeringOSError(code,`Contract validation failed: ${name}`,{errors:validate.errors});
}

export function clearContractCache(){cache.clear()}
