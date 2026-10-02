import assert from "node:assert/strict";
import test from "node:test";

import {
  createContactIdempotencyKey,
  idempotencyKeyAfterAttempt,
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
