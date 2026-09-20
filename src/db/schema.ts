import {
  pgTable,
  bigserial,
  bigint,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// ==============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// ==============================================================================

export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  plan: text("plan"),
  memberSince: timestamp("member_since", { withTimezone: true }),
  region: text("region"),
  language: text("language"),
  maturityRating: text("maturity_rating"),
  isKids: boolean("is_kids"),
  regionSource: text("region_source"),
});

export const dislikes = pgTable("dislikes", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }),
});

export const myList = pgTable("my_list", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }),
});

export const playableContent = pgTable("playable_content", {
  tmdbId: bigint("tmdb_id", { mode: "number" }).primaryKey().notNull(),
  muxPlaybackId: text("mux_playback_id").notNull(),
  muxAssetId: text("mux_asset_id"),
  availableRegions: text("available_regions").array(),
});

export const watchHistory = pgTable("watch_history", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  title: text("title"),
  posterPath: text("poster_path"),
  seasonNumber: integer("season_number").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  episodeTmdbId: bigint("episode_tmdb_id", { mode: "number" }),
  progressSeconds: integer("progress_seconds"),
  durationSeconds: integer("duration_seconds"),
  completed: boolean("completed"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  muxPlaybackId: text("mux_playback_id"),
  device: text("device"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
