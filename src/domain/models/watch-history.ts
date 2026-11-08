import { type MediaType } from "./library-item.ts";

export interface WatchHistoryItem {
  id: number;
  userId: string;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  title: string | null;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeTmdbId: number | null;
  progressSeconds: number | null;
  durationSeconds: number | null;
  completed: boolean | null;
  completedAt: Date | null;
  muxPlaybackId: string | null;
  device: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface WatchProgressInput {
  profileId: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  title?: string;
  posterPath?: string;
  playbackId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
  durationSeconds: number;
}

export interface UpsertWatchHistoryRecord {
  profileId: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  title?: string;
  posterPath?: string;
  muxPlaybackId?: string;
  seasonNumber: number;
  episodeNumber: number;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface SeasonEpisodeProgress {
  episodeNumber: number;
  progressSeconds: number | null;
  durationSeconds: number | null;
}
