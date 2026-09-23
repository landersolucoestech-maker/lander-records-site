import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contactTopics } from "@/lib/db/schema";
import { mockContactTopics, mockDataEnabled } from "@/lib/mocks";
export async function getContactTopics() {
  if (mockDataEnabled()) return mockContactTopics;
  return getDb().select().from(contactTopics).where(eq(contactTopics.active, true)).orderBy(asc(contactTopics.position), asc(contactTopics.name));
}
