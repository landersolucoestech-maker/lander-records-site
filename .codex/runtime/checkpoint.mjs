#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {root,cdir,normalizedState,workspaceFingerprint,uid,writeJson,argMap} from './lib/core.mjs';
const a=argMap(),r=root(),dir=path.join(cdir(r),'state','checkpoints');fs.mkdirSync(dir,{recursive:true});const id=a.id||uid('CP');const cp={schemaVersion:1,id,createdAt:new Date().toISOString(),note:a.note||null,workspace:workspaceFingerprint(r),state:normalizedState(r)};writeJson(path.join(dir,`${id}.json`),cp);console.log(JSON.stringify(cp,null,2));
