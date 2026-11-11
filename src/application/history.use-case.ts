import { AppError } from "./errors/app.error.ts";
import { normalizeLimit } from "./pagination.ts";
import {
  type SeasonEpisodeProgress,
  type UpdateWatchHistoryInput,
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
    if (
      progressSeconds < 0 ||
      durationSeconds <= 0 ||
      progressSeconds > durationSeconds
    ) {
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

  async getHistoryItemById(
    profileId: string,
    id: number,
  ): Promise<WatchHistoryItem> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(id, "id");

    const found = await this.watchHistoryRepository.findByIdForProfile(
      id,
      validProfileId,
    );
    if (!found) {
      throw AppError.notFound("Watch history item not found");
    }
    return found;
  }

  async updateHistoryItem(
    profileId: string,
    id: number,
    input: UpdateWatchHistoryInput,
  ): Promise<WatchHistoryItem> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(id, "id");

    const updates: UpdateWatchHistoryInput = {};
    if (input.progressSeconds !== undefined) {
      const p = requireFiniteNumber(input.progressSeconds, "progressSeconds");
      if (p < 0) {
        throw AppError.badRequest("progressSeconds must be >= 0");
      }
      updates.progressSeconds = p;
    }
    if (input.durationSeconds !== undefined) {
      const d = requireFiniteNumber(input.durationSeconds, "durationSeconds");
      if (d <= 0) {
        throw AppError.badRequest("durationSeconds must be > 0");
      }
      updates.durationSeconds = d;
    }
    if (input.title !== undefined) {
      if (typeof input.title !== "string") {
        throw AppError.badRequest("title must be a string");
      }
      updates.title = input.title;
    }
    if (input.posterPath !== undefined) {
      if (typeof input.posterPath !== "string") {
        throw AppError.badRequest("posterPath must be a string");
      }
      updates.posterPath = input.posterPath;
    }
    if (input.completed !== undefined) {
      if (typeof input.completed !== "boolean") {
        throw AppError.badRequest("completed must be a boolean");
      }
      updates.completed = input.completed;
    }
    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") {
        throw AppError.badRequest("isActive must be a boolean");
      }
      updates.isActive = input.isActive;
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest("No valid fields to update");
    }

    const updated = await this.watchHistoryRepository.updateByIdForProfile(
      id,
      validProfileId,
      updates,
    );
    if (!updated) {
      throw AppError.notFound("Watch history item not found");
    }
    return updated;
  }

  async deleteHistoryItem(
    profileId: string,
    id: number,
  ): Promise<{ success: boolean }> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(id, "id");

    const deleted = await this.watchHistoryRepository.softDeleteForProfile(
      id,
      validProfileId,
    );
    if (!deleted) {
      throw AppError.notFound("Watch history item not found");
    }
    return { success: true };
  }
}