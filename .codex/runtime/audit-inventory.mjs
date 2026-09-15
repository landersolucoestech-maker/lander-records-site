#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const explicitExternal=[
 'AGENTS.md','.gitignore','.gitattributes','eslint.config.mjs','package.json','.nvmrc',
 '.github/workflows/cms-ci.yml','.github/workflows/deploy-ionos.yml',
 'docs/DEPLOYMENT.md','tests/unit/production-readiness.test.mjs'
];
const generatedAuditArtifacts=new Set(['CODEX_ENGINEERING_OS_INVENTORY.json','CODEX_ENGINEERING_OS_AUDIT_REPORT.md']);
const ignoredNames=new Set(['.git','node_modules','.next','dist','build','coverage','test-results','playwright-report','.local']);
const normalize=p=>p.replace(/\\/g,'/');
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const isText=buffer=>!buffer.includes(0);
const walk=dir=>{const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(ignoredNames.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...walk(full));else if(entry.isFile())out.push(full)}return out};
const codexFiles=walk(path.join(projectRoot,'.codex'));
const allRepoFiles=walk(projectRoot);
const discoveredExternal=allRepoFiles.filter(full=>{
 const rel=normalize(path.relative(projectRoot,full));if(rel.startsWith('.codex/')||generatedAuditArtifacts.has(rel))return false;
 let text;try{const body=fs.readFileSync(full);if(!isText(body))return false;text=body.toString('utf8')}catch{return false}
 return /(?:\.codex\/|\.codex\\|AGENTS\.md|aceo\.mjs|localhost-guardian|Engineering OS)/i.test(text);
});
const selected=[...new Set([...codexFiles,...explicitExternal.map(rel=>path.join(projectRoot,rel)),...discoveredExternal].filter(fs.existsSync))].sort((a,b)=>normalize(path.relative(projectRoot,a)).localeCompare(normalize(path.relative(projectRoot,b))));
const raw=selected.map(full=>{const body=fs.readFileSync(full),rel=normalize(path.relative(projectRoot,full)),text=isText(body)?body.toString('utf8'):null;return {full,body,rel,text}});
const classify=rel=>{
 if(rel==='AGENTS.md')return ['instructions','authority'];
 if(rel==='.codex/engineering-os.json')return ['manifest','claimed-authority'];
 if(rel.startsWith('.codex/agents/'))return ['agent-definition','configuration'];
 if(rel.startsWith('.codex/contracts/'))return ['contract','schema'];
 if(rel.startsWith('.codex/policies/'))return ['policy','configuration'];
 if(rel.startsWith('.codex/rules/'))return ['rule','documentation'];
 if(rel.startsWith('.codex/runtime/'))return ['runtime','executable-tooling'];
 if(rel.startsWith('.codex/skills/'))return ['skill','instructions'];
 if(rel.startsWith('.codex/state/'))return ['state','generated'];
 if(rel.startsWith('.codex/workflows/'))return ['workflow','configuration'];
 if(rel.startsWith('.github/workflows/'))return ['ci-workflow','executable-tooling'];
 if(rel.endsWith('.md'))return ['documentation','reference'];
 return ['configuration','reference'];
};
const referencesFrom=text=>{
 if(!text)return[];const refs=[];
 for(const candidate of raw){if(candidate.rel===text)continue;const escaped=candidate.rel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(new RegExp(escaped.replaceAll('/','[\\\\/]'),'i').test(text))refs.push(candidate.rel)}
 return [...new Set(refs)].sort();
};
const entries=raw.map(row=>{
 const [type,role]=classify(row.rel),references=referencesFrom(row.text),referencedBy=[];
 return {path:row.rel,type,role,bytes:row.body.length,lines:row.text===null?null:(row.text.length?row.text.split(/\r?\n/).length:0),sha256:sha256(row.body),references,referencedBy,authority:['authority','claimed-authority'].includes(role),generated:role==='generated'};
});
const byPath=new Map(entries.map(entry=>[entry.path,entry]));for(const entry of entries)for(const target of entry.references)byPath.get(target)?.referencedBy.push(entry.path);
for(const entry of entries){entry.referencedBy.sort();entry.orphan=entry.referencedBy.length===0&&!['AGENTS.md','.codex/engineering-os.json','.codex/runtime/aceo.mjs'].includes(entry.path)}
const git=args=>execFileSync('git',args,{cwd:projectRoot,encoding:'utf8'}).trim();
const inventory={schemaVersion:1,generatedAt:new Date().toISOString(),repository:{root:normalize(projectRoot),branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),origin:git(['remote','get-url','origin'])},eligibility:{included:['AGENTS.md','.codex/**','explicit external control/config/CI files','repository files referencing Engineering OS'],ignored:[...ignoredNames]},summary:{files:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),orphans:entries.filter(e=>e.orphan).length,inventoryHash:sha256(entries.map(e=>`${e.path}\0${e.sha256}`).join('\n'))},files:entries};
const json=JSON.stringify(inventory,null,2)+'\n',outputArg=process.argv.indexOf('--output');
if(outputArg>=0){const output=path.resolve(projectRoot,process.argv[outputArg+1]);if(!output.startsWith(projectRoot+path.sep))throw Error('output must remain inside repository');fs.writeFileSync(output,json)}
else process.stdout.write(json);
