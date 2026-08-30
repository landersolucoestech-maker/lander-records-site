#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,cdir,walk,writeJson,readJson} from './lib/core.mjs';
const r=root(), files=walk(r).filter(p=>!p.includes(`${path.sep}.codex${path.sep}`));
const ext={'.ts':'typescript','.tsx':'typescript-react','.js':'javascript','.mjs':'javascript','.py':'python','.go':'go','.rs':'rust','.java':'java','.kt':'kotlin','.swift':'swift','.rb':'ruby','.php':'php','.cs':'csharp'};
const langs=[...new Set(files.map(p=>ext[path.extname(p)]).filter(Boolean))].sort();
const managers=[];for(const [f,n] of [['pnpm-lock.yaml','pnpm'],['yarn.lock','yarn'],['package-lock.json','npm'],['uv.lock','uv'],['poetry.lock','poetry'],['requirements.txt','pip'],['go.mod','go'],['Cargo.toml','cargo']])if(fs.existsSync(path.join(r,f)))managers.push(n);
const pkg=readJson(path.join(r,'package.json'));const commands={};
const pm=managers.includes('pnpm')?'pnpm':managers.includes('yarn')?'yarn':'npm run';
if(pkg?.scripts)for(const k of ['dev','start','serve','lint','typecheck','test','build','check'])if(pkg.scripts[k])commands[k]=`${pm} ${k}`;
const names=files.map(p=>p.toLowerCase()),risk=[];const hit=(label,re)=>{if(names.some(p=>re.test(p)))risk.push(label)};
hit('authentication',/(auth|session|oauth|jwt)/);hit('authorization',/(permission|rbac|acl|policy)/);hit('database',/(migration|schema|database|prisma|drizzle|sequelize)/);hit('payments',/(payment|billing|stripe|checkout)/);hit('infrastructure',/(terraform|pulumi|kubernetes|helm|dockerfile)/);hit('ai-llm',/(prompt|llm|rag|embedding|openai|anthropic)/);hit('public-api',/(openapi|swagger|routes|api)/);
const guardian=readJson(path.join(cdir(r),'localhost-guardian.json'),{}),explicitPort=Number(guardian.port||0)||null;
const deps={...(pkg?.dependencies||{}),...(pkg?.devDependencies||{})};let localRuntime=null;
if(pkg?.scripts?.dev||pkg?.scripts?.['start:dev']||pkg?.scripts?.serve||pkg?.scripts?.start){
 const script=pkg.scripts.dev?'dev':pkg.scripts['start:dev']?'start:dev':pkg.scripts.serve?'serve':'start';
 let port=null,framework='generic';const text=pkg.scripts[script];const m=String(text).match(/--port(?:=|\s+)(\d{2,5})|\bPORT=(\d{2,5})\b/i);if(m)port=Number(m[1]||m[2]);
 port=explicitPort||port;
 if(deps.vite){framework='vite';port??=5173}else if(deps.next){framework='next';port??=3000}else if(deps.nuxt){framework='nuxt';port??=3000}else if(deps.astro){framework='astro';port??=4321}else if(deps['@angular/core']){framework='angular';port??=4200}
 localRuntime={detected:true,framework,command:`${pm} ${script}`,port,guardianRequired:true};
}else if(fs.existsSync(path.join(r,'manage.py'))) localRuntime={detected:true,framework:'django',command:'python manage.py runserver 127.0.0.1:8000',port:8000,guardianRequired:true};
const git=(args)=>{try{return execFileSync('git',args,{cwd:r,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null}catch{return null}};
const remote=git(['config','--get','remote.origin.url']),branch=git(['branch','--show-current']);
const remotePath=remote?.replace('https://github.com/','').replace('git@github.com:','')||null;
const repository=remotePath?.endsWith('.git')?remotePath.slice(0,-4):remotePath;
const profile={schemaVersion:1,generatedAt:new Date().toISOString(),root:r,repository,branch,remote,fileCount:files.length,languages:langs,packageManagers:managers,commands,riskSurfaces:[...new Set(risk)],localRuntime,notes:['heuristic discovery; repository documentation and executable configuration remain authoritative']};
writeJson(path.join(cdir(r),'project-profile.json'),profile);console.log(JSON.stringify(profile,null,2));
