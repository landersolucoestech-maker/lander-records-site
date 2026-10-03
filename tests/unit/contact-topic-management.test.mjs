import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const actions = read("app/admin/actions.ts");
const settings = read("app/admin/(protected)/settings/page.tsx");
const tabs = read("app/admin/(protected)/settings/SettingsTabs.tsx");
const contactPage = read("app/(public)/contato/page.tsx");

test("contact topics have persistent admin management wired to the public form", () => {
  assert.match(actions, /export async function upsertContactTopic/);
  assert.match(actions, /requirePersistentAdmin\("editor"\)/);
  assert.match(actions, /export async function deleteContactTopic/);
  assert.match(actions, /requirePersistentAdmin\("admin"\)/);
  assert.match(actions, /revalidatePath\("\/contato"\)/);
  assert.match(settings, /getDb\(\)\.select\(\)\.from\(contactTopics\)/);
  assert.match(settings, /action=\{upsertContactTopic\}/);
  assert.match(settings, /formAction=\{deleteContactTopic\}/);
  assert.match(settings, /mockContactTopics/);
  assert.match(tabs, /key: "contact", label: "Contato"/);
  assert.match(contactPage, /getContactTopics\(\)/);
  assert.match(contactPage, /<ContactForm topics=/);
});
