import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
type Database = ReturnType<typeof drizzle<typeof schema>>;
let database: Database | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. The CMS requires PostgreSQL.");
  }

  if (!client) {
    client = postgres(databaseUrl, {
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      prepare: false,
      idle_timeout: 20,
    });
  }

  if (!database) {
    database = drizzle(client, { schema });
  }

  return database;
}
