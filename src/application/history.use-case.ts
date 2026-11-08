import { AppError } from "./errors/app.error.ts";
import { normalizeLimit } from "./pagination.ts";
import {
  type SeasonEpisodeProgress,
  type WatchHistoryItem,
  type WatchProgressInput,
} from "../domain/models/watch-history.ts";
import { type WatchHistoryRepository } from "../domain/repository/watch-history.repository.ts";

export class HistoryUseCase {
  private readonly watchHistoryRepository: WatchHistoryRepository;

  constructor(watchHistoryRepository: WatchHistoryRepository) {
    this.watchHistoryRepository = watchHistoryRepository;
  }

  async updateWatchProgress(
    data: WatchProgressInput,
  ): Promise<{ success: boolean }> {
    const completed = data.progressSeconds >= data.durationSeconds * 0.9;
    const now = new Date();

    await this.watchHistoryRepository.upsertProgress({
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
      completedAt: completed ? now : null,
      updatedAt: now,
    });

    return { success: true };
  }

  async getContinueWatching(
    profileId: string,
    limit?: number,
  ): Promise<WatchHistoryItem[]> {
    const resolvedLimit = normalizeLimit(limit, 10);
    return this.watchHistoryRepository.getContinueWatching(
      profileId,
      resolvedLimit,
    );
  }

  async getSeasonProgress(
    profileId: string,
    tmdbId: number,
    seasonNumber: number,
  ): Promise<SeasonEpisodeProgress[]> {
    if (isNaN(tmdbId) || isNaN(seasonNumber)) {
      throw AppError.badRequest("tmdbId and seasonNumber must be numbers");
    }

    return this.watchHistoryRepository.getSeasonProgress(
      profileId,
      tmdbId,
      seasonNumber,
    );
  }
}
