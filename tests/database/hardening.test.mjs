import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { migrationWithAtomicHistory, resolveChecksum } from "../../scripts/migration-utils.mjs";
import { compareCatalog } from "../../scripts/db-catalog.mjs";

const read = (file) => fs.readFile(new URL(`../../${file}`, import.meta.url), "utf8");

test("canonical 0007 and 0008 never destroy metrics or media provenance", async () => {
  const [metrics, media] = await Promise.all([
    read("migrations/0007_external_integrations.sql"),
    read("migrations/0008_local_media_storage.sql"),
  ]);
  assert.doesNotMatch(metrics, /\bDELETE\s+FROM\s+artist_metrics\b/i);
  assert.doesNotMatch(media, /\bUPDATE\s+media_assets\b/i);
});

test("corrective migration changes defaults without rewriting data", async () => {
  const sql = await read("migrations/0010_preserve_integration_history.sql");
  assert.match(sql, /SET DEFAULT 'supabase_storage'/i);
  assert.doesNotMatch(sql, /^\s*(?:DELETE\s+FROM|TRUNCATE|DROP\s+(?:TABLE|COLUMN))\b/im);
  assert.match(sql, /PRIMARY KEY \(artist_id, platform, source\)/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS artist_metric_history/i);
  assert.match(sql, /INSERT INTO artist_metric_history[\s\S]*FROM artist_metrics/i);
});

test("Drizzle and final migration agree on storage provider default", async () => {
  const [schema, migration] = await Promise.all([
    read("lib/db/schema.ts"),
    read("migrations/0010_preserve_integration_history.sql"),
  ]);
  assert.match(schema, /storageProvider:[\s\S]*?\.default\("supabase_storage"\)/);
  assert.match(migration, /storage_provider SET DEFAULT 'supabase_storage'/i);
});

test("migration and history record execute in the same transaction", () => {
  const planned = migrationWithAtomicHistory("BEGIN;\nSELECT 1;\nCOMMIT;", "0010.sql", "abc");
  assert.equal((planned.match(/\bBEGIN\b/g) || []).length, 1);
  assert.equal((planned.match(/\bCOMMIT\b/g) || []).length, 1);
  assert.ok(planned.indexOf("INSERT INTO cms_schema_migrations") < planned.indexOf("COMMIT"));
});

test("only exact legacy checksum transitions are accepted", () => {
  const approved = [{ from: "old", to: "new" }];
  assert.equal(resolveChecksum("same", "same", approved), "match");
  assert.equal(resolveChecksum("old", "new", approved), "approved_transition");
  assert.equal(resolveChecksum("unknown", "new", approved), "reject");
  assert.equal(resolveChecksum("old", "different", approved), "reject");
});

test("known destructive 0007 and 0008 hashes transition only to safe canonical files", async () => {
  const transitions = JSON.parse(await read("migrations/legacy-checksums.json"));
  const [metrics, media] = await Promise.all([
    read("migrations/0007_external_integrations.sql"),
    read("migrations/0008_local_media_storage.sql"),
  ]);
  const digest = async (source) => {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(source).digest("hex");
  };
  assert.equal(transitions["0007_external_integrations.sql"][0].to, await digest(metrics));
  assert.equal(transitions["0008_local_media_storage.sql"][0].to, await digest(media));
  assert.equal(transitions["0007_external_integrations.sql"][0].from, "3198489e34822db78c107c5098911806d9dfd4e7589642d0e07c537869879295");
  assert.equal(transitions["0008_local_media_storage.sql"][0].from, "dd3fec9fc7bce589d03259d43446156bf747d9bf1db04422871bdb869d61b4db");
});

test("Soundcharts sync writes history and conflicts on source-aware key", async () => {
  const source = await read("lib/integrations/sync.ts");
  assert.match(source, /insert\(artistMetricHistory\)/);
  assert.match(source, /target: \[artistMetrics\.artistId, artistMetrics\.platform, artistMetrics\.source\]/);
});

test("database audit is project-specific and covers structural dimensions", async () => {
  const source = `${await read("scripts/audit-db.mjs")}\n${await read("scripts/db-catalog.mjs")}`;
  assert.match(source, /PROJECT=lander-records-site-portal/);
  for (const evidence of [
    'tables: "TABLES"', 'columns: "COLUMNS"', 'constraints: "CONSTRAINTS"',
    'indexes: "INDEXES"', 'enums: "ENUMS"', "MIGRATIONS_MISSING",
    "MIGRATION_CHECKSUM_DRIFT", "SCHEMA_DRIFT",
  ]) assert.match(source, new RegExp(evidence));
  assert.doesNotMatch(source, /eeautmzrizavuxjkripa/);
});

test("catalog comparison rejects offsetting and definition-level drift", () => {
  const expected = { tables: ["a"], columns: ["a|1|id|uuid|uuid|NO|"], constraints: ["a|p|PRIMARY KEY (id)"], indexes: ["a|CREATE UNIQUE INDEX ON a USING btree (id)"], enums: [] };
  const actual = { ...expected, constraints: ["a|u|UNIQUE (id)"], indexes: ["a|CREATE INDEX ON a USING btree (id) WHERE active"] };
  const drift = compareCatalog(expected, actual);
  assert.deepEqual(drift.constraints.missing, expected.constraints);
  assert.deepEqual(drift.constraints.unexpected, actual.constraints);
  assert.deepEqual(drift.indexes.missing, expected.indexes);
  assert.deepEqual(drift.indexes.unexpected, actual.indexes);
});

test("legacy checksum transition records recognition, not recovery of already erased data", async () => {
  const migration = await read("migrations/0010_preserve_integration_history.sql");
  assert.match(migration, /INSERT INTO artist_metric_history[\s\S]*FROM artist_metrics/i);
  assert.doesNotMatch(migration, /external_archive|local_upload/i);
  assert.equal(resolveChecksum("destructive-hash", "safe-hash", [{ from: "destructive-hash", to: "safe-hash" }]), "approved_transition");
  // A checksum transition can authorize the canonical file but cannot reconstruct rows or provenance
  // that a historical destructive migration removed. Preservation is guaranteed only before 0007/0008.
});
