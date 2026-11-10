import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type SeasonEpisodeProgress,
  type UpdateWatchHistoryInput,
  type UpsertWatchHistoryRecord,
  type WatchHistoryItem,
} from "../../domain/models/watch-history.ts";
import { type WatchHistoryRepository } from "../../domain/repository/watch-history.repository.ts";

function notDeactivatedMovieCondition() {
  return sql`NOT EXISTS (
    SELECT 1 FROM ${schema.playableContent}
    WHERE ${schema.playableContent.tmdbId} = ${schema.watchHistory.tmdbId}
      AND ${schema.playableContent.isActive} = false
  )`;
}

export class DrizzleWatchHistoryRepository implements WatchHistoryRepository {
  async upsertProgress(record: UpsertWatchHistoryRecord): Promise<void> {
    await db
      .insert(schema.watchHistory)
      .values({
        profileId: record.profileId,
        userId: record.userId,
        tmdbId: record.tmdbId,
        mediaType: record.mediaType,
        title: record.title,
        posterPath: record.posterPath,
        muxPlaybackId: record.muxPlaybackId,
        seasonNumber: record.seasonNumber,
        episodeNumber: record.episodeNumber,
        progressSeconds: record.progressSeconds,
        durationSeconds: record.durationSeconds,
        completed: record.completed,
        completedAt: record.completedAt,
        isActive: true,
        updatedAt: record.updatedAt,
      })
      .onConflictDoUpdate({
        target: [
          schema.watchHistory.profileId,
          schema.watchHistory.tmdbId,
          schema.watchHistory.mediaType,
          schema.watchHistory.seasonNumber,
          schema.watchHistory.episodeNumber,
        ],
        set: {
          progressSeconds: record.progressSeconds,
          durationSeconds: record.durationSeconds,
          completed: record.completed,
          completedAt: record.completedAt,
          updatedAt: record.updatedAt,
          title: record.title,
          posterPath: record.posterPath,
          muxPlaybackId: record.muxPlaybackId,
          isActive: true,
        },
      });
  }

  async getContinueWatching(
    profileId: string,
    limit: number,
  ): Promise<WatchHistoryItem[]> {
    return db
      .select()
      .from(schema.watchHistory)
      .where(
        and(
          eq(schema.watchHistory.profileId, profileId),
          eq(schema.watchHistory.completed, false),
          eq(schema.watchHistory.isActive, true),
          gt(schema.watchHistory.progressSeconds, 0),
          notDeactivatedMovieCondition(),
        ),
      )
      .orderBy(desc(schema.watchHistory.updatedAt))
      .limit(limit);
  }

  async getSeasonProgress(
    profileId: string,
    tmdbId: number,
    seasonNumber: number,
  ): Promise<SeasonEpisodeProgress[]> {
    return db
      .select({
        episodeNumber: schema.watchHistory.episodeNumber,
        progressSeconds: schema.watchHistory.progressSeconds,
        durationSeconds: schema.watchHistory.durationSeconds,
      })
      .from(schema.watchHistory)
      .where(
        and(
          eq(schema.watchHistory.profileId, profileId),
          eq(schema.watchHistory.tmdbId, tmdbId),
          eq(schema.watchHistory.seasonNumber, seasonNumber),
          eq(schema.watchHistory.isActive, true),
          notDeactivatedMovieCondition(),
        ),
      );
  }

  async findByIdForProfile(
    id: number,
    profileId: string,
  ): Promise<WatchHistoryItem | null> {
    const rows = await db
      .select()
      .from(schema.watchHistory)
      .where(
        and(
          eq(schema.watchHistory.id, id),
          eq(schema.watchHistory.profileId, profileId),
          eq(schema.watchHistory.isActive, true),
          notDeactivatedMovieCondition(),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async updateByIdForProfile(
    id: number,
    profileId: string,
    input: UpdateWatchHistoryInput,
  ): Promise<WatchHistoryItem | null> {
    const rows = await db
      .update(schema.watchHistory)
      .set({
        ...(input.progressSeconds !== undefined
          ? { progressSeconds: input.progressSeconds }
          : {}),
        ...(input.durationSeconds !== undefined
          ? { durationSeconds: input.durationSeconds }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.posterPath !== undefined
          ? { posterPath: input.posterPath }
          : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.watchHistory.id, id),
          eq(schema.watchHistory.profileId, profileId),
        ),
      )
      .returning();

    return rows[0] ?? null;
  }

  async softDeleteForProfile(id: number, profileId: string): Promise<boolean> {
    const rows = await db
      .update(schema.watchHistory)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.watchHistory.id, id),
          eq(schema.watchHistory.profileId, profileId),
          eq(schema.watchHistory.isActive, true),
          notDeactivatedMovieCondition(),
        ),
      )
      .returning({ id: schema.watchHistory.id });

    return rows.length > 0;
  }
}