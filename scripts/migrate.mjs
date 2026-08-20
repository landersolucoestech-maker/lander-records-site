import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
try {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const migration = await fs.readFile(path.join(migrationsDir, name), "utf8");
    await sql.unsafe(migration);
    console.log(`Applied ${name}`);
  }
  console.log("CMS migrations applied successfully.");
} finally {
  await sql.end({ timeout: 5 });
}
