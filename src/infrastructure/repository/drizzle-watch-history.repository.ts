import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type SeasonEpisodeProgress,
  type UpsertWatchHistoryRecord,
  type WatchHistoryItem,
} from "../../domain/models/watch-history.ts";
import { type WatchHistoryRepository } from "../../domain/repository/watch-history.repository.ts";

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
          gt(schema.watchHistory.progressSeconds, 0),
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
        ),
      );
  }
}
