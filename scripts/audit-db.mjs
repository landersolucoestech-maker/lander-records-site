import fs from "node:fs/promises";
import postgres from "postgres";

const envText = await fs.readFile(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const rawUrl = process.env.DATABASE_URL || "";
const parsedUrl = rawUrl ? new URL(rawUrl) : null;
const protocol = parsedUrl && ["postgresql:", "postgres:"].includes(parsedUrl.protocol)
  ? parsedUrl.protocol.slice(0, -1)
  : "invalid";
const projectRef = parsedUrl?.hostname.split(".")[0] || "";
const expectedTables = [
  "cms_schema_migrations", "admin_users", "media_assets", "artist_categories", "artists",
  "artist_links", "artist_embeds", "post_categories", "posts", "post_tags", "releases",
  "pages", "page_sections", "page_section_items", "navigation_items", "site_settings",
  "social_links", "contact_topics", "contact_submissions", "integration_outbox",
];

console.log(`DATABASE_URL_PRESENT=${Boolean(rawUrl)}`);
console.log(`DATABASE_URL_PROTOCOL=${protocol}`);
console.log(`DATABASE_URL_HOST=${parsedUrl ? `${parsedUrl.hostname.slice(0, 3)}***` : "missing"}`);
console.log(`SUPABASE_PROJECT_MATCH=${projectRef === "eeautmzrizavuxjkripa"}`);

if (!rawUrl) process.exit(2);

const sql = postgres(rawUrl, { max: 1, prepare: false, connect_timeout: 10 });
try {
  const identity = await sql.unsafe("select current_database() as database, current_user as user, version() as version");
  const clock = await sql.unsafe("select now() as now");
  console.log("DATABASE_CONNECTION:PASS");
  console.log(`DATABASE_NAME=${identity[0].database}`);
  console.log(`DATABASE_USER=${identity[0].user}`);
  console.log(`DATABASE_VERSION=${String(identity[0].version).split(" on ")[0]}`);
  console.log(`DATABASE_NOW=${clock[0].now.toISOString()}`);

  const tables = await sql.unsafe("select table_name from information_schema.tables where table_schema = 'public' order by table_name");
  const names = new Set(tables.map((row) => row.table_name));
  console.log(`PUBLIC_TABLES=${tables.map((row) => row.table_name).join(",")}`);
  console.log(`EXPECTED_TABLES_MISSING=${expectedTables.filter((name) => !names.has(name)).join(",")}`);
  console.log(`DATABASE_STATE=${expectedTables.every((name) => names.has(name)) ? "FULL" : expectedTables.every((name) => !names.has(name)) ? "EMPTY" : "PARTIAL"}`);
} catch (error) {
  console.log("DATABASE_CONNECTION:FAIL");
  console.log(`CAUSE=${error.code || "UNKNOWN"}:${String(error.message || error).split("\n")[0]}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
