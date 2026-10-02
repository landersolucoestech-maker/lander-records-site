import fs from "node:fs/promises";
import { openDatabase, readCatalog } from "./db-catalog.mjs";

const rawUrl = process.env.TEST_DATABASE_URL ?? "";
const url = new URL(rawUrl);
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must target an explicitly named local *_test database");
}
const sql = openDatabase(rawUrl);
try {
  const contract = await readCatalog(sql);
  await fs.writeFile("scripts/db-schema-contract.json", `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  console.log("DB_SCHEMA_CONTRACT_CAPTURE=PASS");
} finally { await sql.end({ timeout: 5 }); }
