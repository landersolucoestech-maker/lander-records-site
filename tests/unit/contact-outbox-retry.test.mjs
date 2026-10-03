import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contact = await readFile(new URL("../../lib/contact.ts", import.meta.url), "utf8");
const cron = await readFile(new URL("../../app/api/cron/integrations/route.ts", import.meta.url), "utf8");

test("contact outbox retries claim due work before dispatching", () => {
  assert.match(contact, /export async function retryDueOutboxEvents/);
  assert.match(contact, /pg_advisory_xact_lock/);
  assert.match(contact, /eq\(integrationOutbox\.status, "failed"\)/);
  assert.match(contact, /isNull\(integrationOutbox\.nextAttemptAt\)/);
  assert.match(contact, /lte\(integrationOutbox\.nextAttemptAt, now\)/);
  assert.match(contact, /eq\(integrationOutbox\.status, "pending"\)/);
  assert.match(contact, /lte\(integrationOutbox\.createdAt, stalePendingBefore\)/);

  const pendingBranch = contact.indexOf('eq(integrationOutbox.status, "pending")');
  const pendingClaimGuard = contact.indexOf(
    "or(isNull(integrationOutbox.nextAttemptAt), lte(integrationOutbox.nextAttemptAt, now))",
    pendingBranch,
  );
  const pendingBranchEnd = contact.indexOf("      ))", pendingBranch);
  assert.ok(
    pendingBranch >= 0 && pendingClaimGuard > pendingBranch && pendingClaimGuard < pendingBranchEnd,
    "stale pending work must respect nextAttemptAt so an active claim cannot be selected twice",
  );

  const claimUpdate = contact.indexOf("nextAttemptAt: claimUntil");
  const dispatch = contact.indexOf("await dispatchOutboxEvent(id)");
  assert.ok(claimUpdate >= 0 && dispatch > claimUpdate, "retry work must be claimed before network dispatch");
});

test("integration cron drains the durable contact outbox behind the existing secret boundary", () => {
  assert.match(cron, /CRON_SECRET/);
  assert.match(cron, /authorization/);
  assert.match(cron, /retryDueOutboxEvents/);
  assert.match(cron, /Promise\.all/);
  assert.match(cron, /outbox/);
});


test("webhook delivery validates destination and refuses redirects",()=>{assert.match(contact,/validatedWebhookUrl\(url\)/);assert.match(contact,/url\.protocol !== "https:"/);assert.match(contact,/redirect: "error"/);assert.match(contact,/WEBHOOK_TIMEOUT_MS = 4_000/)});


test("webhook signing refuses weak configured secrets",()=>{assert.match(contact,/secret\.length < 32/);assert.match(contact,/at least 32 characters/)});


test("webhook delivery rejects partial endpoint or secret configuration",()=>{assert.match(contact,/\(url && !secret\) \|\| \(!url && secret\)/);assert.match(contact,/must be configured together/)});


test("webhook failures persist sanitized operational errors only",()=>{assert.match(source,/storedError/);assert.match(source,/Webhook request timed out\./);assert.match(source,/Webhook delivery failed\./);assert.doesNotMatch(source,/lastError: message\.slice/);});