import { AppError } from "./errors/app.error.ts";
import { normalizeLimit } from "./pagination.ts";
import {
  type SeasonEpisodeProgress,
  type WatchHistoryItem,
  type WatchProgressInput,
} from "../domain/models/watch-history.ts";
import { type WatchHistoryRepository } from "../domain/repository/watch-history.repository.ts";
import {
  requireFiniteNumber,
  requireMediaType,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requirePositiveInteger,
} from "./errors/validation.ts";

export class HistoryUseCase {
  private readonly watchHistoryRepository: WatchHistoryRepository;

  constructor(watchHistoryRepository: WatchHistoryRepository) {
    this.watchHistoryRepository = watchHistoryRepository;
  }

  async updateWatchProgress(
    data: WatchProgressInput,
  ): Promise<{ success: boolean }> {
    requireNonEmptyString(data.profileId, "profileId");
    requireNonEmptyString(data.userId, "userId");
    requirePositiveInteger(data.tmdbId, "tmdbId");
    requireMediaType(data.mediaType);
    const progressSeconds = requireFiniteNumber(
      data.progressSeconds,
      "progressSeconds",
    );
    const durationSeconds = requireFiniteNumber(
      data.durationSeconds,
      "durationSeconds",
    );
    if (progressSeconds < 0 || durationSeconds <= 0 || progressSeconds > durationSeconds) {
      throw AppError.badRequest(
        "progressSeconds must be between 0 and durationSeconds",
      );
    }
    if (data.title !== undefined && typeof data.title !== "string") {
      throw AppError.badRequest("title must be a string");
    }
    if (data.posterPath !== undefined && typeof data.posterPath !== "string") {
      throw AppError.badRequest("posterPath must be a string");
    }
    if (data.playbackId !== undefined && typeof data.playbackId !== "string") {
      throw AppError.badRequest("playbackId must be a string");
    }
    if (data.seasonNumber !== undefined) {
      requireNonNegativeInteger(data.seasonNumber, "seasonNumber");
    }
    if (data.episodeNumber !== undefined) {
      requireNonNegativeInteger(data.episodeNumber, "episodeNumber");
    }

    const completed = progressSeconds >= durationSeconds * 0.9;
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
      progressSeconds,
      durationSeconds,
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
    requireNonEmptyString(profileId, "profileId");
    if (limit !== undefined) {
      requirePositiveInteger(limit, "limit");
    }
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
    requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(tmdbId, "tmdbId");
    requireNonNegativeInteger(seasonNumber, "seasonNumber");

    return this.watchHistoryRepository.getSeasonProgress(
      profileId,
      tmdbId,
      seasonNumber,
    );
  }
}
