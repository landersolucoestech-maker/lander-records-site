import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
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

  const appliedRows = await sql`SELECT name, checksum FROM cms_schema_migrations`;
  const applied = new Map(appliedRows.map((row) => [row.name, row.checksum]));

  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

  for (const name of files) {
    const migration = await fs.readFile(path.join(migrationsDir, name), "utf8");
    const checksum = createHash("sha256").update(migration).digest("hex");
    const previousChecksum = applied.get(name);

    if (previousChecksum) {
      if (previousChecksum !== checksum) {
        throw new Error(`Migration ${name} changed after it was applied.`);
      }
      console.log(`Skipped ${name} (already applied)`);
      continue;
    }

    await sql.unsafe(migration);
    await sql`INSERT INTO cms_schema_migrations (name, checksum) VALUES (${name}, ${checksum})`;
    console.log(`Applied ${name}`);
  }

  console.log("CMS migrations applied successfully.");
} finally {
  await sql.end({ timeout: 5 });
}
