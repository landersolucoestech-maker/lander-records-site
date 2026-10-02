import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";
export const root=process.cwd();export const p=(...x)=>path.join(root,...x);
export const readJson=f=>JSON.parse(fs.readFileSync(p(f),"utf8"));
export const exists=f=>fs.existsSync(p(f));export const ensure=f=>fs.mkdirSync(p(f),{recursive:true});
export const id=(prefix="id")=>prefix+"-"+crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const writeJson=(f,v)=>{ensure(path.dirname(p(f)));fs.writeFileSync(p(f),JSON.stringify(v,null,2)+"\n")};
export const die=m=>{console.error(m);process.exit(1)};