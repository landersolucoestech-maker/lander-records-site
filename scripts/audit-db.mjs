import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { compareCatalog, openDatabase, readCatalog } from "./db-catalog.mjs";

try {
  const envText = await fs.readFile(".env.local", "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }

const migrationsDir = path.join(process.cwd(), "migrations");
const migrationNames = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const checksums = new Map(await Promise.all(migrationNames.map(async (name) => [name, createHash("sha256").update(await fs.readFile(path.join(migrationsDir, name))).digest("hex")])));
const expected = JSON.parse(await fs.readFile(new URL("./db-schema-contract.json", import.meta.url), "utf8"));
const rawUrl = process.env.DATABASE_URL ?? "";
let parsed;
try { parsed = new URL(rawUrl); } catch { parsed = null; }
console.log("PROJECT=lander-records-site-portal");
console.log(`DATABASE_URL_PRESENT=${Boolean(rawUrl)}`);
console.log(`DATABASE_URL_PROTOCOL=${parsed?.protocol?.replace(":", "") ?? "invalid"}`);
console.log(`DATABASE_URL_HOST=${parsed ? `${parsed.hostname.slice(0, 3)}***` : "missing"}`);
if (!parsed || !["postgres:", "postgresql:"].includes(parsed.protocol)) process.exit(2);

const sql = openDatabase(rawUrl);
try {
  const actual = await readCatalog(sql);
  const drift = compareCatalog(expected, actual);
  const applied = await sql`SELECT name,checksum FROM cms_schema_migrations ORDER BY name`;
  const appliedMap = new Map(applied.map((row) => [row.name, row.checksum]));
  const history = {
    missing: migrationNames.filter((name) => !appliedMap.has(name)),
    unexpected: applied.filter((row) => !checksums.has(row.name)).map((row) => row.name),
    checksum: migrationNames.filter((name) => appliedMap.has(name) && appliedMap.get(name) !== checksums.get(name)),
  };
  const labels = { tables: "TABLES", columns: "COLUMNS", constraints: "CONSTRAINTS", indexes: "INDEXES", enums: "ENUMS" };
  for (const dimension of Object.keys(labels)) {
    console.log(`${labels[dimension]}_EXPECTED=${expected[dimension].length}`);
    console.log(`${labels[dimension]}_ACTUAL=${actual[dimension].length}`);
    console.log(`${labels[dimension]}_MISSING=${JSON.stringify(drift[dimension]?.missing ?? [])}`);
    console.log(`${labels[dimension]}_UNEXPECTED=${JSON.stringify(drift[dimension]?.unexpected ?? [])}`);
  }
  console.log(`MIGRATIONS_EXPECTED=${migrationNames.length}`);
  console.log(`MIGRATIONS_APPLIED=${applied.length}`);
  console.log(`MIGRATIONS_MISSING=${JSON.stringify(history.missing)}`);
  console.log(`MIGRATIONS_UNKNOWN=${JSON.stringify(history.unexpected)}`);
  console.log(`MIGRATION_CHECKSUM_DRIFT=${JSON.stringify(history.checksum)}`);
  const failed = Object.keys(drift).length > 0 || Object.values(history).some((items) => items.length > 0);
  console.log(`SCHEMA_DRIFT=${failed ? "FAIL" : "PASS"}`);
  if (failed) process.exitCode = 1;
} catch (error) {
  console.log("DATABASE_CONNECTION=FAIL");
  console.log(`CAUSE=${error.code ?? "UNKNOWN"}:${String(error.message ?? error).split("\n")[0]}`);
  process.exitCode = 1;
} finally { await sql.end({ timeout: 5 }); }
