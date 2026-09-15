import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';

const source=path.resolve(import.meta.dirname,'../../..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const freePort=()=>new Promise((resolve,reject)=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const address=server.address();server.close(error=>error?reject(error):resolve(address.port))});server.on('error',reject)});

test('HTTP failure with a live TCP listener is degraded, not healthy',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'eos-guardian-http-'));
  const port=await freePort();
  let server;
  try{
    fs.cpSync(path.join(source,'.codex'),path.join(root,'.codex'),{recursive:true});
    fs.symlinkSync(path.join(source,'node_modules'),path.join(root,'node_modules'),process.platform==='win32'?'junction':'dir');
    fs.writeFileSync(path.join(root,'.codex','state-location.json'),JSON.stringify({schemaVersion:1,authoritativeState:'.local/state.json'}));
    fs.writeFileSync(path.join(root,'.codex','localhost-guardian.json'),JSON.stringify({schemaVersion:1,enabled:true,required:true,command:null,host:'127.0.0.1',port,protocol:'http',healthPath:'/',probe:'http',startupTimeoutMs:500}));
    server=spawn(process.execPath,['-e',`require('node:http').createServer((request,response)=>{response.writeHead(404);response.end('missing')}).listen(${port},'127.0.0.1')`],{cwd:root,stdio:'ignore'});
    await sleep(300);

    const result=spawnSync(process.execPath,[path.join(root,'.codex','runtime','localhost-guardian.mjs'),'ensure','--quiet'],{cwd:root,encoding:'utf8'});
    assert.ok(result.stdout,`guardian produced no JSON: ${result.stderr||result.error||'unknown failure'}`);
    const output=JSON.parse(result.stdout);
    assert.equal(result.status,2);
    assert.equal(output.ok,false);
    assert.equal(output.action,'no-recovery-command');
    assert.equal(output.probe.degraded,true);
    assert.match(output.probe.detail,/http-failed:http-404;tcp-ok/);
  }finally{
    if(server){
      const exited=server.exitCode!==null?Promise.resolve():new Promise(resolve=>server.once('exit',resolve));
      try{server.kill('SIGTERM')}catch{}
      await exited;
    }
    fs.rmSync(root,{recursive:true,force:true,maxRetries:3,retryDelay:50});
  }
});
