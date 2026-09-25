import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { resolveContactClientIp } from "../../lib/contact-client-ip.ts";

const headers = (values) => ({ get: (name) => values[name.toLowerCase()] ?? null });

test("X-Real-IP from the trusted proxy wins over any forwarded chain", () => {
  assert.equal(resolveContactClientIp(headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1, 203.0.113.7" })), "203.0.113.7");
});

test("a spoofed leading X-Forwarded-For hop cannot rotate the rate-limit identity", () => {
  const first = resolveContactClientIp(headers({ "x-forwarded-for": "10.0.0.1, 198.51.100.4" }));
  const second = resolveContactClientIp(headers({ "x-forwarded-for": "10.0.0.2, 198.51.100.4" }));
  assert.equal(first, "198.51.100.4");
  assert.equal(second, first);
});

test("missing proxy headers resolve to a stable sentinel", () => {
  assert.equal(resolveContactClientIp(headers({})), "unknown");
  assert.equal(resolveContactClientIp(headers({ "x-forwarded-for": " , " })), "unknown");
});

test("the contact route derives the rate-limit key through the trusted resolver", () => {
  const route = fs.readFileSync(new URL("../../app/api/contact/route.ts", import.meta.url), "utf8");
  assert.match(route, /hashIp\(resolveContactClientIp\(request\.headers\)\)/);
  assert.doesNotMatch(route, /x-forwarded-for"\)\?\.split\(","\)\[0\]/);
});

test("the contact form keeps its element across the awaited submit", () => {
  const form = fs.readFileSync(new URL("../../app/(public)/contato/ContactForm.tsx", import.meta.url), "utf8");
  const submitBody = form.slice(form.indexOf("async function submit"), form.indexOf("return ("));
  const firstAwait = submitBody.indexOf("await ");
  assert.ok(firstAwait > 0);
  assert.doesNotMatch(submitBody.slice(firstAwait), /event\.currentTarget/, "event.currentTarget is null after the handler yields");
  assert.match(submitBody, /formElement\.reset\(\)/);
  assert.match(submitBody, /response\.json\(\)\.catch\(/, "non-JSON error pages must not surface parser errors to visitors");
});
