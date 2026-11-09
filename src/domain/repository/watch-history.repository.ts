import {
  type SeasonEpisodeProgress,
  type UpdateWatchHistoryInput,
  type UpsertWatchHistoryRecord,
  type WatchHistoryItem,
} from "../models/watch-history.ts";

export interface WatchHistoryRepository {
  upsertProgress(record: UpsertWatchHistoryRecord): Promise<void>;
  getContinueWatching(
    profileId: string,
    limit: number,
  ): Promise<WatchHistoryItem[]>;
  getSeasonProgress(
    profileId: string,
    tmdbId: number,
    seasonNumber: number,
  ): Promise<SeasonEpisodeProgress[]>;
  findByIdForProfile(
    id: number,
    profileId: string,
  ): Promise<WatchHistoryItem | null>;
  updateByIdForProfile(
    id: number,
    profileId: string,
    input: UpdateWatchHistoryInput,
  ): Promise<WatchHistoryItem | null>;
  softDeleteForProfile(id: number, profileId: string): Promise<boolean>;
}