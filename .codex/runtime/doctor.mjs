#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,cdir,readJson} from './lib/core.mjs';
const r=root(),c=cdir(r),checks=[];const add=(n,ok,d='')=>checks.push({name:n,ok,detail:d});
add('node>=20',Number(process.versions.node.split('.')[0])>=20,process.versions.node);
try{add('git',!!execFileSync('git',['--version'],{encoding:'utf8'}).trim())}catch{add('git',false,'git-not-found')}
for(const rel of ['AGENTS.md','.codex','.codex/agents/registry.json','.codex/runtime/preflight.mjs','.codex/runtime/localhost-guardian.mjs','.codex/policies/localhost-continuity.json']) add(rel,fs.existsSync(path.join(r,rel)));
const cfg=readJson(path.join(c,'localhost-guardian.json'),null);add('localhost-guardian-config',!!cfg,cfg?'loaded':'missing');
const bad=checks.filter(x=>!x.ok);console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',checks},null,2));process.exit(bad.length?1:0);
