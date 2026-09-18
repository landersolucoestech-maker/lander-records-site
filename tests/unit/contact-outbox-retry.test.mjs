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
