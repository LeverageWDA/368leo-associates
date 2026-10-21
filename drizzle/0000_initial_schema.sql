CREATE TYPE "public"."admin_role" AS ENUM('OWNER', 'EDITOR');--> statement-breakpoint
CREATE TYPE "public"."admin_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('artwork', 'image', 'audio_master', 'audio_playback');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."media_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('apple_music', 'spotify', 'youtube_music', 'amazon_music', 'tidal', 'bandcamp', 'soundcloud', 'shopify', 'other');--> statement-breakpoint
CREATE TYPE "public"."playback_mode" AS ENUM('full', 'preview', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."release_type" AS ENUM('single', 'ep', 'album');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"email" text NOT NULL,
	"display_name" text,
	"role" "admin_role" NOT NULL,
	"status" "admin_status" DEFAULT 'invited' NOT NULL,
	"can_publish" boolean DEFAULT false NOT NULL,
	"invited_by_id" uuid,
	"last_sign_in_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "admin_users_email_shape" CHECK ("admin_users"."email" ~ '^[^@\s]+@[^@\s]+$')
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"image_asset_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "artists_slug_shape" CHECK ("artists"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_admin_id" uuid,
	"actor_clerk_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"visibility" "media_visibility" DEFAULT 'private' NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"storage_provider" text NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"checksum_sha256" text,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"alt_text" text,
	"replaced_by_id" uuid,
	"uploaded_by_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_byte_size_positive" CHECK ("media_assets"."byte_size" > 0),
	CONSTRAINT "media_assets_master_private" CHECK ("media_assets"."kind" <> 'audio_master' OR "media_assets"."visibility" = 'private')
);
--> statement-breakpoint
CREATE TABLE "platform_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid,
	"track_id" uuid,
	"artist_id" uuid,
	"platform" "platform" NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_links_single_owner" CHECK (num_nonnulls("platform_links"."release_id", "platform_links"."track_id", "platform_links"."artist_id") = 1),
	CONSTRAINT "platform_links_https" CHECK ("platform_links"."url" ~ '^https://')
);
--> statement-breakpoint
CREATE TABLE "release_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"track_id" uuid,
	"artist_id" uuid,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" "release_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"primary_artist_id" uuid NOT NULL,
	"release_date" date,
	"description" text,
	"cover_asset_id" uuid,
	"catalogue_number" text,
	"upc" text,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "releases_slug_unique" UNIQUE("slug"),
	CONSTRAINT "releases_catalogue_number_unique" UNIQUE("catalogue_number"),
	CONSTRAINT "releases_upc_unique" UNIQUE("upc"),
	CONSTRAINT "releases_slug_shape" CHECK ("releases"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "releases_published_has_timestamp" CHECK ("releases"."status" <> 'published' OR "releases"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"draft" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"updated_by_id" uuid,
	"published_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_content_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"disc_number" integer DEFAULT 1 NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"duration_ms" integer,
	"isrc" text,
	"explicit" boolean,
	"playback_mode" "playback_mode" DEFAULT 'unavailable' NOT NULL,
	"playback_asset_id" uuid,
	"master_asset_id" uuid,
	"preview_start_ms" integer,
	"preview_duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_position_positive" CHECK ("tracks"."position" > 0 AND "tracks"."disc_number" > 0),
	CONSTRAINT "tracks_duration_positive" CHECK ("tracks"."duration_ms" IS NULL OR "tracks"."duration_ms" > 0),
	CONSTRAINT "tracks_playable_has_asset" CHECK ("tracks"."playback_mode" = 'unavailable' OR "tracks"."playback_asset_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_invited_by_id_admin_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_created_by_id_admin_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_updated_by_id_admin_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_replaced_by_id_media_assets_id_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_admin_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_links" ADD CONSTRAINT "platform_links_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_links" ADD CONSTRAINT "platform_links_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_links" ADD CONSTRAINT "platform_links_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_links" ADD CONSTRAINT "platform_links_verified_by_id_admin_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_credits" ADD CONSTRAINT "release_credits_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_credits" ADD CONSTRAINT "release_credits_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_credits" ADD CONSTRAINT "release_credits_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_primary_artist_id_artists_id_fk" FOREIGN KEY ("primary_artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_cover_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_created_by_id_admin_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_updated_by_id_admin_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_id_admin_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_published_by_id_admin_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_playback_asset_id_media_assets_id_fk" FOREIGN KEY ("playback_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_master_asset_id_media_assets_id_fk" FOREIGN KEY ("master_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_lower_key" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "artists_status_idx" ON "artists" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_bucket_key_key" ON "media_assets" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "media_assets_kind_status_idx" ON "media_assets" USING btree ("kind","status");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_links_release_platform_key" ON "platform_links" USING btree ("release_id","platform") WHERE "platform_links"."release_id" IS NOT NULL AND "platform_links"."platform" <> 'other';--> statement-breakpoint
CREATE UNIQUE INDEX "platform_links_track_platform_key" ON "platform_links" USING btree ("track_id","platform") WHERE "platform_links"."track_id" IS NOT NULL AND "platform_links"."platform" <> 'other';--> statement-breakpoint
CREATE UNIQUE INDEX "platform_links_artist_platform_key" ON "platform_links" USING btree ("artist_id","platform") WHERE "platform_links"."artist_id" IS NOT NULL AND "platform_links"."platform" <> 'other';--> statement-breakpoint
CREATE INDEX "release_credits_release_idx" ON "release_credits" USING btree ("release_id","position");--> statement-breakpoint
CREATE INDEX "release_credits_track_idx" ON "release_credits" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "releases_status_date_idx" ON "releases" USING btree ("status","release_date");--> statement-breakpoint
CREATE INDEX "releases_primary_artist_idx" ON "releases" USING btree ("primary_artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracks_release_disc_position_key" ON "tracks" USING btree ("release_id","disc_number","position");--> statement-breakpoint
CREATE UNIQUE INDEX "tracks_isrc_key" ON "tracks" USING btree ("isrc");