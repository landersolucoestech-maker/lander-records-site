#!/usr/bin/env node
import {argMap,normalizedState} from './lib/core.mjs';
const a=argMap(),levels={A0:0,A1:1,A2:2,A3:3,A4:4,A5:5},s=normalizedState();const current=a.current||s.mission?.authority||'A3',required=a.required||'A0',action=a.action||'unspecified';
const block=[];if(!(current in levels)||!(required in levels))block.push('invalid-authority');else if(levels[current]<levels[required])block.push(`authority-insufficient:${current}<${required}`);if(['production','destructive','purchase','credential-export'].includes(action)&&levels[current]<5)block.push(`explicit-A5-required:${action}`);const out={verdict:block.length?'BLOCKED':'PASS',current,required,action,blockers:block};console.log(JSON.stringify(out,null,2));process.exit(block.length?2:0);
