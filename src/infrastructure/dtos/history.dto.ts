import { type MediaType } from "../../domain/models/library-item.ts";
import {
  type SeasonEpisodeProgress,
  type WatchHistoryItem,
  type WatchProgressInput,
} from "../../domain/models/watch-history.ts";

export interface UpdateWatchProgressRequestDto {
  tmdbId: number;
  mediaType: MediaType;
  progressSeconds: number;
  durationSeconds: number;
  title?: string;
  posterPath?: string;
  playbackId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export type WatchHistoryItemResponseDto = WatchHistoryItem;
export type SeasonEpisodeProgressResponseDto = SeasonEpisodeProgress;

export function toWatchProgressInput(
  userId: string,
  body: UpdateWatchProgressRequestDto,
): WatchProgressInput {
  return {
    profileId: userId,
    userId,
    tmdbId: body.tmdbId,
    mediaType: body.mediaType,
    progressSeconds: body.progressSeconds,
    durationSeconds: body.durationSeconds,
    title: body.title,
    posterPath: body.posterPath,
    playbackId: body.playbackId,
    seasonNumber: body.seasonNumber,
    episodeNumber: body.episodeNumber,
  };
}
