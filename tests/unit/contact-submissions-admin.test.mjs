import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const actions = read("app/admin/actions.ts");
const inbox = read("app/admin/(protected)/contacts/page.tsx");

test("contact submissions expose a persistent operational workflow", () => {
  assert.match(actions, /export async function updateContactSubmissionStatus/);
  assert.match(actions, /contact_submission\.status_updated/);
  assert.match(actions, /revalidatePath\("\/admin\/contacts"\)/);
  assert.match(inbox, /contactSubmissions/);
  assert.match(inbox, /contactTopics/);
  assert.match(inbox, /Consentimento:/);
  assert.match(inbox, /utmSource/);
  assert.match(inbox, /action=\{updateContactSubmissionStatus\}/);
  assert.match(inbox, /session\.source === "session"/);
  assert.match(navigation, /href: "\/admin\/contacts"/);
  assert.match(preview, /"\/admin\/contacts"/);
});
