import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contactTopics } from "@/lib/db/schema";
export async function getContactTopics() {
  return getDb().select().from(contactTopics).where(eq(contactTopics.active, true)).orderBy(asc(contactTopics.position), asc(contactTopics.name));
}
