CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dislikes" (
	"id" bigserial PRIMARY KEY,
	"profile_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"added_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "my_list" (
	"id" bigserial PRIMARY KEY,
	"profile_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"added_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "playable_content" (
	"tmdb_id" bigint PRIMARY KEY,
	"mux_playback_id" text NOT NULL,
	"mux_asset_id" text,
	"available_regions" text[]
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY,
	"display_name" text,
	"avatar_url" text,
	"plan" text,
	"member_since" timestamp with time zone,
	"region" text,
	"language" text,
	"maturity_rating" text,
	"is_kids" boolean,
	"region_source" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "watch_history" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"title" text,
	"poster_path" text,
	"season_number" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"episode_tmdb_id" bigint,
	"progress_seconds" integer,
	"duration_seconds" integer,
	"completed" boolean,
	"completed_at" timestamp with time zone,
	"mux_playback_id" text,
	"device" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_profile_id_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "my_list" ADD CONSTRAINT "my_list_profile_id_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_profile_id_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;