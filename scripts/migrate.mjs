import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { migrationWithAtomicHistory, resolveChecksum } from "./migration-utils.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

let migrationTarget;
try { migrationTarget = new URL(databaseUrl); } catch { console.error("DATABASE_URL must be a valid PostgreSQL URL."); process.exit(1); }
const localTarget = ["localhost", "127.0.0.1", "::1"].includes(migrationTarget.hostname);
if (!localTarget && process.env.MIGRATION_RELEASE_GUARD !== "VERIFIED_PITR_BACKUP_REHEARSAL") {
  console.error("Remote migration refused. Use scripts/release/db-0010-release.mjs with verified PITR, backup, and rehearsal evidence.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS cms_schema_migrations (
      name text PRIMARY KEY,
      checksum varchar(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS cms_schema_migration_checksum_transitions (
      migration_name text NOT NULL,
      previous_checksum varchar(64) NOT NULL,
      current_checksum varchar(64) NOT NULL,
      transitioned_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (migration_name, previous_checksum, current_checksum)
    )
  `);

  let approvedTransitions = {};
  try {
    approvedTransitions = JSON.parse(await fs.readFile(path.join(process.cwd(), "migrations", "legacy-checksums.json"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const appliedRows = await sql`SELECT name, checksum FROM cms_schema_migrations`;
  const applied = new Map(appliedRows.map((row) => [row.name, row.checksum]));

  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

  for (const name of files) {
    const migration = await fs.readFile(path.join(migrationsDir, name), "utf8");
    const checksum = createHash("sha256").update(migration).digest("hex");
    const previousChecksum = applied.get(name);

    if (previousChecksum) {
      const resolution = resolveChecksum(previousChecksum, checksum, approvedTransitions[name] || []);
      if (resolution === "reject") {
        throw new Error(`Migration ${name} changed after it was applied.`);
      }
      if (resolution === "approved_transition") {
        await sql.begin(async (tx) => {
          const changed = await tx`UPDATE cms_schema_migrations SET checksum=${checksum} WHERE name=${name} AND checksum=${previousChecksum} RETURNING name`;
          if (changed.length !== 1) throw new Error(`Checksum transition race for ${name}.`);
          await tx`INSERT INTO cms_schema_migration_checksum_transitions (migration_name, previous_checksum, current_checksum) VALUES (${name}, ${previousChecksum}, ${checksum}) ON CONFLICT DO NOTHING`;
        });
        console.log(`Verified checksum transition ${name}`);
      }
      console.log(`Skipped ${name} (already applied)`);
      continue;
    }

    await sql.unsafe(migrationWithAtomicHistory(migration, name, checksum));
    console.log(`Applied ${name}`);
  }

  console.log("CMS migrations applied successfully.");
} finally {
  await sql.end({ timeout: 5 });
}
