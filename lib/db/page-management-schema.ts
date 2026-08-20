import { boolean, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { pageSections } from "./schema";

export const sectionDefinitions = pgTable("section_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 120 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  description: text("description").default("").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  keyUnique: uniqueIndex("section_definitions_key_unique").on(table.key),
}));

export const pageSectionBindings = pgTable("page_section_bindings", {
  pageSectionId: uuid("page_section_id").notNull().references(() => pageSections.id, { onDelete: "cascade" }),
  definitionId: uuid("definition_id").notNull().references(() => sectionDefinitions.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.pageSectionId, table.definitionId] }),
}));
