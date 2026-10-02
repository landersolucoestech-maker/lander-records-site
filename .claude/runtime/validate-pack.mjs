import fs from "node:fs";import {readJson,exists,die} from "./common.mjs";
const a=readJson(".claude/agents/registry.json"),s=readJson(".claude/skills/registry.json");
const agents=[a.orchestration.primary,...a.orchestration.agents,...a.investigation,...a.engineering,...a.quality,...a.ai,...a.domain,...a.operational];
const skills=[...s.core,...s.audit,...s.validation,...s.ai,...s.operational],bad=[];
for(const n of new Set(agents)){const f=".claude/agents/"+n+".md";if(!exists(f))bad.push("missing agent "+n);else{const t=fs.readFileSync(f,"utf8");for(const h of ["name: "+n,"## Mission","## Procedure","## Completion"])if(!t.includes(h))bad.push(n+" missing "+h)}}
for(const n of new Set(skills)){const f=".claude/skills/"+n+"/SKILL.md";if(!exists(f))bad.push("missing skill "+n);else{const t=fs.readFileSync(f,"utf8");for(const h of ["name: "+n,"## Purpose","## Procedure","## Failure / recovery","## Completion"])if(!t.includes(h))bad.push(n+" missing "+h)}}
if(bad.length)die(bad.join("\n"));console.log("Claude pack valid:",new Set(agents).size,"agents,",new Set(skills).size,"skills");