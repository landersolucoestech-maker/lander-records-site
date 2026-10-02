import {execFileSync} from "node:child_process";
const branch=execFileSync("git",["branch","--show-current"],{encoding:"utf8"}).trim();
if(branch!=="dev"){console.error("DEV_ONLY_MAIN_FROZEN_POLICY: writes blocked on "+(branch||"<detached>"));process.exit(1)}
console.log("DEV_ONLY_MAIN_FROZEN_POLICY PASS");
