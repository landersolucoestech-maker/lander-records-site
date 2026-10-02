import fs from "node:fs";import {readJson,exists,die} from "./common.mjs";
const req=["agent.schema.json","skill.schema.json","task.schema.json","workflow.schema.json","approval.schema.json","evidence.schema.json"];let bad=[];
for(const f of req){const x=readJson(".claude/contracts/"+f);if(x.type!=="object"||!Array.isArray(x.required)||!x.required.length)bad.push("invalid contract "+f)}
const sm=readJson(".claude/state-machine.json");if(!sm.states||!sm.transitions)bad.push("invalid state machine");
for(const f of ["mission.mjs","preflight.mjs","orchestrate.mjs","evidence.mjs","recovery.mjs","completion-gate.mjs","self-test.mjs"])if(!exists(".claude/runtime/"+f))bad.push("missing runtime "+f);
const pkg=readJson("package.json");if(String(pkg.scripts?.["test:engineering-os"]||"").includes(".codex"))bad.push("Codex test entrypoint");
if(bad.length)die(bad.join("\n"));console.log("Claude integrity verified");