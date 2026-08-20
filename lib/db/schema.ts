import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const adminRole = pgEnum("admin_role", ["owner", "admin", "editor", "viewer"]);
export const contentStatus = pgEnum("content_status", ["draft", "published", "archived"]);
export const mediaStatus = pgEnum("media_status", ["active", "archived"]);
export const contactStatus = pgEnum("contact_status", ["new", "processing", "exported", "spam", "archived"]);
export const outboxStatus = pgEnum("outbox_status", ["pending", "delivered", "failed", "disabled"]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").default("editor").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  emailUnique: uniqueIndex("admin_users_email_unique").on(table.email),
}));

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenUnique: uniqueIndex("admin_sessions_token_hash_unique").on(table.tokenHash),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageProvider: varchar("storage_provider", { length: 40 }).default("vercel_blob").notNull(),
  storageKey: text("storage_key").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text").default("").notNull(),
  originalFilename: text("original_filename").notNull(),
  status: mediaStatus("status").default("active").notNull(),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  storageKeyUnique: uniqueIndex("media_assets_storage_key_unique").on(table.storageKey),
}));

export const artistCategories = pgTable("artist_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  description: text("description").default("").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  showAsFilter: boolean("show_as_filter").default(true).notNull(),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("artist_categories_slug_unique").on(table.slug),
}));

export const artists = pgTable("artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  eyebrow: varchar("eyebrow", { length: 180 }).default("").notNull(),
  shortBio: text("short_bio").default("").notNull(),
  biography: text("biography").default("").notNull(),
  cardMediaId: uuid("card_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  heroMediaId: uuid("hero_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  ogMediaId: uuid("og_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  featureOnHome: boolean("feature_on_home").default(false).notNull(),
  homePosition: integer("home_position").default(0).notNull(),
  listPosition: integer("list_position").default(0).notNull(),
  seoTitle: varchar("seo_title", { length: 180 }).default("").notNull(),
  seoDescription: text("seo_description").default("").notNull(),
  canonicalUrl: text("canonical_url").default("").notNull(),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("artists_slug_unique").on(table.slug),
}));

export const artistCategoryRelations = pgTable("artist_category_relations", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => artistCategories.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  position: integer("position").default(0).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artistId, table.categoryId] }),
}));

export const artistLinks = pgTable("artist_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 40 }).default("social").notNull(),
  platform: varchar("platform", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  url: text("url").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const artistEmbeds = pgTable("artist_embeds", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 180 }).default("").notNull(),
  url: text("url").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  ...timestamps,
});

export const postCategories = pgTable("post_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  showAsFilter: boolean("show_as_filter").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("post_categories_slug_unique").on(table.slug),
}));

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("tags_slug_unique").on(table.slug),
}));

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 260 }).notNull(),
  excerpt: text("excerpt").default("").notNull(),
  contentMarkdown: text("content_markdown").default("").notNull(),
  authorName: varchar("author_name", { length: 160 }).default("Lander Records").notNull(),
  categoryId: uuid("category_id").references(() => postCategories.id, { onDelete: "set null" }),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  ogMediaId: uuid("og_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  status: contentStatus("status").default("draft").notNull(),
  featuredOnHome: boolean("featured_on_home").default(false).notNull(),
  homePosition: integer("home_position").default(0).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  seoTitle: varchar("seo_title", { length: 180 }).default("").notNull(),
  seoDescription: text("seo_description").default("").notNull(),
  canonicalUrl: text("canonical_url").default("").notNull(),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("posts_slug_unique").on(table.slug),
}));

export const postTags = pgTable("post_tags", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const releases = pgTable("releases", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  artistName: varchar("artist_name", { length: 220 }).notNull(),
  releaseType: varchar("release_type", { length: 80 }).default("Single").notNull(),
  releaseDate: date("release_date"),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  platform: varchar("platform", { length: 80 }).default("Spotify").notNull(),
  platformUrl: text("platform_url").default("").notNull(),
  externalId: varchar("external_id", { length: 180 }),
  position: integer("position").default(0).notNull(),
  featuredOnHome: boolean("featured_on_home").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("releases_slug_unique").on(table.slug),
}));

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  seoTitle: varchar("seo_title", { length: 180 }).default("").notNull(),
  seoDescription: text("seo_description").default("").notNull(),
  canonicalUrl: text("canonical_url").default("").notNull(),
  ogMediaId: uuid("og_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  keyUnique: uniqueIndex("pages_key_unique").on(table.key),
  slugUnique: uniqueIndex("pages_slug_unique").on(table.slug),
}));

export const pageSections = pgTable("page_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  sectionKey: varchar("section_key", { length: 120 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  eyebrow: varchar("eyebrow", { length: 180 }).default("").notNull(),
  title: text("title").default("").notNull(),
  subtitle: text("subtitle").default("").notNull(),
  body: text("body").default("").notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  position: integer("position").default(0).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  pageSectionUnique: uniqueIndex("page_sections_page_key_unique").on(table.pageId, table.sectionKey),
}));

export const pageSectionItems = pgTable("page_section_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionId: uuid("section_id").notNull().references(() => pageSections.id, { onDelete: "cascade" }),
  itemKey: varchar("item_key", { length: 120 }).default("").notNull(),
  title: text("title").default("").notNull(),
  subtitle: text("subtitle").default("").notNull(),
  body: text("body").default("").notNull(),
  label: text("label").default("").notNull(),
  url: text("url").default("").notNull(),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  position: integer("position").default(0).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  ...timestamps,
});

export const navigationItems = pgTable("navigation_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  menuKey: varchar("menu_key", { length: 80 }).default("primary").notNull(),
  parentId: uuid("parent_id"),
  label: varchar("label", { length: 160 }).notNull(),
  url: text("url").notNull(),
  linkType: varchar("link_type", { length: 20 }).default("internal").notNull(),
  position: integer("position").default(0).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  newTab: boolean("new_tab").default(false).notNull(),
  ...timestamps,
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id", { length: 40 }).primaryKey().default("site"),
  brandName: varchar("brand_name", { length: 180 }).default("Lander Records").notNull(),
  tagline: text("tagline").default("").notNull(),
  contactEmail: varchar("contact_email", { length: 320 }).default("").notNull(),
  contactPhone: varchar("contact_phone", { length: 80 }).default("").notNull(),
  location: text("location").default("").notNull(),
  address: text("address").default("").notNull(),
  hours: text("hours").default("").notNull(),
  defaultSeoTitle: varchar("default_seo_title", { length: 180 }).default("").notNull(),
  defaultSeoDescription: text("default_seo_description").default("").notNull(),
  logoMediaId: uuid("logo_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  socialImageMediaId: uuid("social_image_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const socialLinks = pgTable("social_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: varchar("platform", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  url: text("url").default("").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const contactTopics = pgTable("contact_topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  saasType: varchar("saas_type", { length: 120 }).default("").notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: uniqueIndex("contact_topics_slug_unique").on(table.slug),
}));

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  idempotencyKey: uuid("idempotency_key").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 80 }).default("").notNull(),
  topicId: uuid("topic_id").references(() => contactTopics.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  consent: boolean("consent").notNull(),
  consentVersion: varchar("consent_version", { length: 40 }).notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  source: varchar("source", { length: 120 }).default("lander-records-site").notNull(),
  pagePath: text("page_path").default("").notNull(),
  referrer: text("referrer").default("").notNull(),
  utmSource: text("utm_source").default("").notNull(),
  utmMedium: text("utm_medium").default("").notNull(),
  utmCampaign: text("utm_campaign").default("").notNull(),
  utmTerm: text("utm_term").default("").notNull(),
  utmContent: text("utm_content").default("").notNull(),
  userAgent: text("user_agent").default("").notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  status: contactStatus("status").default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idempotencyUnique: uniqueIndex("contact_submissions_idempotency_unique").on(table.idempotencyKey),
}));

export const integrationOutbox = pgTable("integration_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: varchar("event_type", { length: 160 }).notNull(),
  aggregateType: varchar("aggregate_type", { length: 80 }).notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: outboxStatus("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error").default("").notNull(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ...timestamps,
});

export const slugRedirects = pgTable("slug_redirects", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  oldSlug: varchar("old_slug", { length: 260 }).notNull(),
  newSlug: varchar("new_slug", { length: 260 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  oldSlugUnique: uniqueIndex("slug_redirects_entity_old_unique").on(table.entityType, table.oldSlug),
}));
