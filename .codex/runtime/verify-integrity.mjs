#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),m=JSON.parse(fs.readFileSync(path.join(root,'INTEGRITY.json'),'utf8')),bad=[];
for(const row of m.files){const p=path.join(root,row.path);if(!fs.existsSync(p)){bad.push(`missing:${row.path}`);continue}const b=fs.readFileSync(p),h=crypto.createHash('sha256').update(b).digest('hex');if(h!==row.sha256||b.length!==row.bytes)bad.push(`mismatch:${row.path}`)}
console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',verified:m.files.length,errors:bad},null,2));process.exit(bad.length?1:0);
