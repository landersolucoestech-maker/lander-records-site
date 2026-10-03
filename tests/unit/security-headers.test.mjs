import assert from "node:assert/strict";import {readFile} from "node:fs/promises";import test from "node:test";
test("global response headers preserve hardened production baseline",async()=>{const s=await readFile(new URL("../../next.config.mjs",import.meta.url),"utf8");for(const token of ["X-Content-Type-Options","Referrer-Policy","X-Frame-Options","Permissions-Policy","Strict-Transport-Security","Cross-Origin-Opener-Policy","X-DNS-Prefetch-Control"])assert.match(s,new RegExp(token));assert.match(s,/max-age=31536000; includeSubDomains/);assert.doesNotMatch(s,/poweredByHeader:\s*true/)});


test("reverse proxy and Server Actions both admit the contracted 50 MB hero upload",async()=>{const next=await readFile(new URL("../../next.config.mjs",import.meta.url),"utf8");const nginx=await readFile(new URL("../../infra/nginx/lander-records.conf.example",import.meta.url),"utf8");assert.match(next,/bodySizeLimit:\s*"64mb"/);assert.match(nginx,/client_max_body_size 64m;/)});
