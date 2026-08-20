import { pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { mediaAssets, posts } from "./schema";

export const postProfiles = pgTable("post_profiles", {
  postId: uuid("post_id").primaryKey().references(() => posts.id, { onDelete: "cascade" }),
  authorMediaId: uuid("author_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  publicationLink: text("publication_link").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const postLinks = pgTable("post_links", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 80 }).notNull(),
  url: text("url").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.platform] }),
}));
