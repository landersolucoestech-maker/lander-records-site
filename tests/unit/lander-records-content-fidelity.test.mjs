import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const home = read("app/(public)/page.tsx");
const initialContent = read("migrations/0002_initial_content.sql");
const cleanup = read("migrations/0014_home_lander_records_editorial_identity.sql");

test("Home news identity is corrected without erasing intentional Portal Lander ecosystem content", () => {
  assert.match(initialContent, /'news','post_feed','PORTAL LANDER','ÚLTIMAS NOVIDADES'/);
  assert.match(cleanup, /p\.key = 'home'/);
  assert.match(cleanup, /ps\.section_key = 'news'/);
  assert.match(cleanup, /SET eyebrow = 'LANDER RECORDS'/);
  assert.doesNotMatch(cleanup, /UPDATE[\s\S]*page_section_items/);
  assert.doesNotMatch(cleanup, /REPLACE|Portal Lander'\s*,\s*'/i);
});

test("public Home renders the corrected CMS eyebrow rather than a hardcoded Portal label", () => {
  assert.match(home, /newsSection\.eyebrow/);
  assert.doesNotMatch(home, />PORTAL LANDER</i);
});
