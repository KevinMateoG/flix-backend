import {
  type SeasonEpisodeProgress,
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
}
