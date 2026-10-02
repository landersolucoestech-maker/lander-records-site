import {execFileSync} from "node:child_process";
const branch=execFileSync("git",["branch","--show-current"],{encoding:"utf8"}).trim();
if(branch!=="main"){console.error("MAIN_ONLY_POLICY: writes blocked on "+(branch||"<detached>"));process.exit(1)}
console.log("MAIN_ONLY_POLICY PASS");