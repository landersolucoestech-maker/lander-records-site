import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as coreSchema from "./schema";
import * as artistManagementSchema from "./artist-management-schema";
import * as newsManagementSchema from "./news-management-schema";
import * as pageManagementSchema from "./page-management-schema";
import * as integrationSchema from "./integration-schema";

const schema = { ...coreSchema, ...artistManagementSchema, ...newsManagementSchema, ...pageManagementSchema, ...integrationSchema };

type Database = ReturnType<typeof drizzle<typeof schema>>;
type DbGlobal = {
  client?: ReturnType<typeof postgres>;
  database?: Database;
  databaseUrl?: string;
};

const dbGlobal = globalThis as typeof globalThis & { __landerRecordsDb?: DbGlobal };
const state = dbGlobal.__landerRecordsDb ?? (dbGlobal.__landerRecordsDb = {});

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. The CMS requires PostgreSQL.");
  }

  if (!state.client || state.databaseUrl !== databaseUrl) {
    state.client = postgres(databaseUrl, {
      max: process.env.NODE_ENV === "production" ? 5 : 1,
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 10,
    });
    state.databaseUrl = databaseUrl;
    state.database = undefined;
  }

  if (!state.database) {
    state.database = drizzle(state.client, { schema });
  }

  return state.database;
}
