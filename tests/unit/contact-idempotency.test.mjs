import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../../app/api/contact/route.ts", import.meta.url), "utf8");

import {
  createContactIdempotencyKey,
  idempotencyKeyAfterAttempt,
  isContactIdempotencyConflict,
} from "../../lib/contact-idempotency.ts";

test("independent contact operations receive independent keys", () => {
  const values = ["first-operation", "second-operation"];
  const randomUuid = () => values.shift();

  const first = createContactIdempotencyKey(randomUuid);
  const second = idempotencyKeyAfterAttempt(first, true, randomUuid);

  assert.equal(first, "first-operation");
  assert.equal(second, "second-operation");
  assert.notEqual(first, second);
});

test("a retry of the same failed operation preserves its key", () => {
  const current = "same-operation";
  const randomUuid = () => {
    throw new Error("must not rotate a retry key");
  };

  assert.equal(idempotencyKeyAfterAttempt(current, false, randomUuid), current);
});


test("contact UI tolerates non-JSON gateway failures",async()=>{const {readFile}=await import("node:fs/promises");const source=await readFile(new URL("../../app/(public)/contato/ContactForm.tsx",import.meta.url),"utf8");assert.match(source,/content-type/);assert.match(source,/includes\("application\/json"\)/);assert.match(source,/result\?\.error/)});


test("contact endpoint rejects oversized declared bodies before JSON parsing",()=>{const guard=route.indexOf("content-length");const parse=route.indexOf("request.json()");assert.ok(guard>=0&&parse>guard);assert.match(route,/16_384/);assert.match(route,/status: 413/)});


test("contact endpoint requires JSON content type before parsing",()=>{const guard=route.indexOf("content-type");const parse=route.indexOf("request.json()");assert.ok(guard>=0&&parse>guard);assert.match(route,/application\/json/);assert.match(route,/status: 415/)});


test("contact storage bounds user-agent metadata",()=>{assert.match(route,/user-agent[^\n]*slice\(0, 1000\)/)});


test("contact client bounds stalled submissions",()=>{const source=readFileSync(new URL("../../app/(public)/contato/ContactForm.tsx",import.meta.url),"utf8");assert.match(source,/signal: AbortSignal\.timeout\(15_000\)/);});

test("contact endpoint does not emit raw caught error details",()=>{const source=readFileSync(new URL("../../app/api/contact/route.ts",import.meta.url),"utf8");assert.match(source,/logger\.error\("contact_submission_failed", \{ configurationError \}\)/);assert.doesNotMatch(source,/console\.error\("contact_submission_failed", message\)/);});

test("only the contact idempotency unique constraint is treated as a duplicate race",()=>{assert.equal(isContactIdempotencyConflict({code:"23505",constraint:"contact_submissions_idempotency_key_key"}),true);assert.equal(isContactIdempotencyConflict({code:"23505",constraint:"other_unique"}),false);assert.equal(isContactIdempotencyConflict(new Error("duplicate")),false);});

test("idempotent contact retries resolve before the serialized rate-limit transaction",()=>{const duplicate=route.indexOf("if (existing[0])");const limiter=route.indexOf("pg_advisory_xact_lock(hashtext(${ipHash}))");assert.ok(duplicate>=0&&limiter>duplicate);});

test("contact rate limiting is serialized with the insert",()=>{const source=readFileSync(new URL("../../app/api/contact/route.ts",import.meta.url),"utf8");assert.match(source,/pg_advisory_xact_lock\(hashtext\(\$\{ipHash\}\)\)/);assert.match(source,/count\(\*\)::int/);assert.match(source,/throw new ContactRateLimitError\(\)/);assert.doesNotMatch(source,/isContactRateLimited\(ipHash\)/);});