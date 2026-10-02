import {
  bigint,
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { artists } from "./schema";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const artistProfiles = pgTable("artist_profiles", {
  artistId: uuid("artist_id").primaryKey().references(() => artists.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  pageLink: text("page_link").default("").notNull(),
  hireTitle: varchar("hire_title", { length: 180 }).default("Contrate").notNull(),
  hireText: text("hire_text").default("").notNull(),
  hireButtonLabel: varchar("hire_button_label", { length: 120 }).default("Quero contratar").notNull(),
  ...timestamps,
});

export const artistRoles = pgTable("artist_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("artist_roles_slug_unique").on(table.slug),
}));

export const artistRoleRelations = pgTable("artist_role_relations", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => artistRoles.id, { onDelete: "cascade" }),
  position: integer("position").default(0).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artistId, table.roleId] }),
}));

export const musicGenres = pgTable("music_genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("music_genres_slug_unique").on(table.slug),
}));

export const artistGenreRelations = pgTable("artist_genre_relations", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  genreId: uuid("genre_id").notNull().references(() => musicGenres.id, { onDelete: "cascade" }),
  position: integer("position").default(0).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artistId, table.genreId] }),
}));

export const artistMetrics = pgTable("artist_metrics", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 80 }).notNull(),
  value: bigint("value", { mode: "number" }).default(0).notNull(),
  source: varchar("source", { length: 40 }).default("legacy").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artistId, table.platform, table.source] }),
}));

export const artistMetricHistory = pgTable("artist_metric_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 80 }).notNull(),
  value: bigint("value", { mode: "number" }).notNull(),
  source: varchar("source", { length: 40 }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const artistPublicationDestinations = pgTable("artist_publication_destinations", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 120 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  description: text("description").default("").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  keyUnique: uniqueIndex("artist_publication_destinations_key_unique").on(table.key),
}));

export const artistPublicationPlacements = pgTable("artist_publication_placements", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  destinationId: uuid("destination_id").notNull().references(() => artistPublicationDestinations.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  position: integer("position").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artistId, table.destinationId] }),
}));
