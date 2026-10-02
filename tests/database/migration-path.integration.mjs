import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL || "";
const url = new URL(databaseUrl);
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must target an explicitly named local *_test database.");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDir = path.join(process.cwd(), "migrations");
const remoteChecksums = {
  "0002_initial_content.sql": "4b1db53e75fb8dfa2d5c8d67bae0f50201095b6991a274edfcbb136d886f5506",
  "0007_external_integrations.sql": "3198489e34822db78c107c5098911806d9dfd4e7589642d0e07c537869879295",
  "0008_local_media_storage.sql": "dd3fec9fc7bce589d03259d43446156bf747d9bf1db04422871bdb869d61b4db",
};

try {
  await sql.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  await sql.unsafe("CREATE TABLE cms_schema_migrations (name text PRIMARY KEY, checksum varchar(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  const artistId = randomUUID();
  const mediaId = randomUUID();
  const files = (await fs.readdir(migrationsDir)).filter((name) => /^000[1-9].*\.sql$/.test(name)).sort();
  for (const name of files) {
    if (name === "0007_external_integrations.sql") {
      await sql`INSERT INTO artists (id,name,slug) VALUES (${artistId},'Upgrade fixture',${`upgrade-${artistId}`})`;
      await sql`INSERT INTO artist_metrics (artist_id,platform,value) VALUES (${artistId},'spotify',111)`;
    }
    if (name === "0008_local_media_storage.sql") {
      await sql`INSERT INTO media_assets (id,storage_provider,storage_key,url,mime_type,byte_size,original_filename) VALUES (${mediaId},'external_archive',${`archive/${mediaId}`},'https://archive.invalid/a','image/jpeg',1,'a.jpg')`;
    }
    const source = await fs.readFile(path.join(migrationsDir, name), "utf8");
    await sql.unsafe(source);
    const checksum = remoteChecksums[name] || createHash("sha256").update(source).digest("hex");
    await sql`INSERT INTO cms_schema_migrations (name, checksum) VALUES (${name}, ${checksum})`;
  }
  execFileSync(process.execPath, ["scripts/migrate.mjs"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "inherit",
  });

  await sql`INSERT INTO artist_metrics (artist_id,platform,value,source) VALUES (${artistId},'spotify',222,'soundcharts') ON CONFLICT (artist_id,platform,source) DO UPDATE SET value=excluded.value`;
  const metrics = await sql`SELECT source,value::int FROM artist_metrics WHERE artist_id=${artistId} AND platform='spotify' ORDER BY source`;
  assert.deepEqual(metrics.map((row) => [row.source, row.value]), [["legacy", 111], ["soundcharts", 222]]);
  const history = await sql`SELECT source,value::int FROM artist_metric_history WHERE artist_id=${artistId}`;
  assert.deepEqual(history.map((row) => [row.source, row.value]), [["legacy", 111]]);
  const media = await sql`SELECT storage_provider FROM media_assets WHERE id=${mediaId}`;
  assert.equal(media[0].storage_provider, "external_archive");
  const defaultRow = await sql`SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='media_assets' AND column_name='storage_provider'`;
  assert.match(defaultRow[0].column_default, /supabase_storage/);
  const transitions = await sql`SELECT migration_name,previous_checksum,current_checksum FROM cms_schema_migration_checksum_transitions ORDER BY migration_name`;
  assert.deepEqual(transitions.map((row) => row.migration_name), ["0002_initial_content.sql", "0007_external_integrations.sql", "0008_local_media_storage.sql"]);
  console.log("MIGRATION_UPGRADE_PATH=PASS");
} finally {
  await sql.end({ timeout: 5 });
}
