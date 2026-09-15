#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {root,cdir} from './lib/core.mjs';
const r=root(),file=path.join(cdir(r),'integrity-manifest.json');let m;
try{m=JSON.parse(fs.readFileSync(file,'utf8'))}catch(error){const status=error?.code==='ENOENT'?'BLOCKED':'FAIL';console.log(JSON.stringify({status,code:error?.code==='ENOENT'?'INTEGRITY_MANIFEST_MISSING':'INTEGRITY_MANIFEST_INVALID',manifest:file,detail:error.message},null,2));process.exit(status==='BLOCKED'?77:1)}
const bad=[];if(m.schemaVersion!==1||!Array.isArray(m.files)||!m.files.length)bad.push('manifest-schema-invalid');for(const row of m.files||[]){const p=path.resolve(r,row.path);if(!p.startsWith(r+path.sep)){bad.push(`path-escape:${row.path}`);continue}if(!fs.existsSync(p)){bad.push(`missing:${row.path}`);continue}const b=fs.readFileSync(p),h=crypto.createHash('sha256').update(b).digest('hex');if(h!==row.sha256||b.length!==row.bytes)bad.push(`mismatch:${row.path}`)}
console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',manifestVersion:m.version||null,verified:m.files?.length||0,errors:bad},null,2));process.exit(bad.length?1:0);
