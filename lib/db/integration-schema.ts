import {
  bigint,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminUsers, artists } from "./schema";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const landerRecordsIntegrationSettings = pgTable("lander_records_integration_settings", {
  key: varchar("key", { length: 40 }).primaryKey(),
  instagramUrl: text("instagram_url").default("").notNull(),
  youtubeUrl: text("youtube_url").default("").notNull(),
  spotifyPlaylistUrl: text("spotify_playlist_url").default("").notNull(),
  spotifyPlaylistId: varchar("spotify_playlist_id", { length: 80 }).default("").notNull(),
  spotifyPlaylistSnapshotId: varchar("spotify_playlist_snapshot_id", { length: 180 }).default("").notNull(),
  spotifyUserId: varchar("spotify_user_id", { length: 180 }).default("").notNull(),
  spotifyRefreshTokenEncrypted: text("spotify_refresh_token_encrypted").default("").notNull(),
  spotifyConnectedAt: timestamp("spotify_connected_at", { withTimezone: true }),
  spotifyLastSyncedAt: timestamp("spotify_last_synced_at", { withTimezone: true }),
  spotifyLastError: text("spotify_last_error").default("").notNull(),
  soundchartsArtistUuid: varchar("soundcharts_artist_uuid", { length: 80 }).default("").notNull(),
  soundchartsResolutionStatus: varchar("soundcharts_resolution_status", { length: 40 }).default("unresolved").notNull(),
  soundchartsMatchedVia: varchar("soundcharts_matched_via", { length: 120 }).default("").notNull(),
  soundchartsLastResolvedAt: timestamp("soundcharts_last_resolved_at", { withTimezone: true }),
  soundchartsLastSyncedAt: timestamp("soundcharts_last_synced_at", { withTimezone: true }),
  soundchartsLastError: text("soundcharts_last_error").default("").notNull(),
  ...timestamps,
});

export const artistExternalIdentities = pgTable("artist_external_identities", {
  artistId: uuid("artist_id").primaryKey().references(() => artists.id, { onDelete: "cascade" }),
  soundchartsArtistUuid: varchar("soundcharts_artist_uuid", { length: 80 }).default("").notNull(),
  resolutionStatus: varchar("resolution_status", { length: 40 }).default("unresolved").notNull(),
  matchedViaPlatform: varchar("matched_via_platform", { length: 80 }).default("").notNull(),
  matchedViaIdentifier: text("matched_via_identifier").default("").notNull(),
  lastResolvedAt: timestamp("last_resolved_at", { withTimezone: true }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error").default("").notNull(),
  ...timestamps,
});

export const integrationMetricCache = pgTable("integration_metric_cache", {
  entityType: varchar("entity_type", { length: 40 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  platform: varchar("platform", { length: 80 }).notNull(),
  metric: varchar("metric", { length: 80 }).notNull(),
  value: bigint("value", { mode: "number" }).notNull(),
  source: varchar("source", { length: 40 }).default("soundcharts").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.entityType, table.entityId, table.platform, table.metric] }),
}));

export const spotifyReleaseCache = pgTable("spotify_release_cache", {
  position: integer("position").primaryKey(),
  playlistId: varchar("playlist_id", { length: 80 }).notNull(),
  albumId: varchar("album_id", { length: 80 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  artistName: varchar("artist_name", { length: 300 }).notNull(),
  coverUrl: text("cover_url").default("").notNull(),
  spotifyUrl: text("spotify_url").notNull(),
  releaseDate: varchar("release_date", { length: 10 }).notNull(),
  releaseDatePrecision: varchar("release_date_precision", { length: 16 }).notNull(),
  playlistAddedAt: timestamp("playlist_added_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const spotifyOauthStates = pgTable("spotify_oauth_states", {
  stateHash: varchar("state_hash", { length: 64 }).primaryKey(),
  adminUserId: uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
