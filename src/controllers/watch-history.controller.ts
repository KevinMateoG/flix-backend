import { db } from "../db/db.ts";
import * as schemas from "../db/schema.ts";
import { eq, and, gt, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export type WatchProgressInput = {
  profileId: string;
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title?: string;
  posterPath?: string;
  playbackId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
  durationSeconds: number;
};

export async function update_watch_progress(data: WatchProgressInput) {
  const completed = data.progressSeconds >= data.durationSeconds * 0.9;

  await db
    .insert(schemas.watchHistory)
    .values({
      profileId: data.profileId,
      userId: data.userId,
      tmdbId: data.tmdbId,
      mediaType: data.mediaType,
      title: data.title,
      posterPath: data.posterPath,
      muxPlaybackId: data.playbackId,
      seasonNumber: data.seasonNumber ?? 0,
      episodeNumber: data.episodeNumber ?? 0,
      progressSeconds: data.progressSeconds,
      durationSeconds: data.durationSeconds,
      completed,
      completedAt: completed ? new Date() : null,
      isActive: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        schemas.watchHistory.profileId,
        schemas.watchHistory.tmdbId,
        schemas.watchHistory.mediaType,
        schemas.watchHistory.seasonNumber,
        schemas.watchHistory.episodeNumber,
      ],
      set: {
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        completed,
        completedAt: completed ? new Date() : null,
        isActive: true,
        updatedAt: new Date(),
        title: data.title,
        posterPath: data.posterPath,
        muxPlaybackId: data.playbackId,
      },
    });
}

export async function get_continue_watching(profileId: string, limit = 10) {
  return db
    .select()
    .from(schemas.watchHistory)
    .where(
      and(
        eq(schemas.watchHistory.profileId, profileId),
        eq(schemas.watchHistory.completed, false),
        eq(schemas.watchHistory.isActive, true),
        gt(schemas.watchHistory.progressSeconds, 0),
        sql`NOT EXISTS (
          SELECT 1 FROM ${schemas.playableContent}
          WHERE ${schemas.playableContent.tmdbId} = ${schemas.watchHistory.tmdbId}
            AND ${schemas.playableContent.isActive} = false
        )`,
      ),
    )
    .orderBy(desc(schemas.watchHistory.updatedAt))
    .limit(limit);
}

export async function get_season_progress(profileId: string, tmdbId: number, seasonNumber: number) {
  return db
    .select({
      episodeNumber: schemas.watchHistory.episodeNumber,
      progressSeconds: schemas.watchHistory.progressSeconds,
      durationSeconds: schemas.watchHistory.durationSeconds,
    })
    .from(schemas.watchHistory)
    .where(
      and(
        eq(schemas.watchHistory.profileId, profileId),
        eq(schemas.watchHistory.tmdbId, tmdbId),
        eq(schemas.watchHistory.seasonNumber, seasonNumber),
        eq(schemas.watchHistory.isActive, true),
        sql`NOT EXISTS (
          SELECT 1 FROM ${schemas.playableContent}
          WHERE ${schemas.playableContent.tmdbId} = ${schemas.watchHistory.tmdbId}
            AND ${schemas.playableContent.isActive} = false
        )`,
      ),
    );
}
