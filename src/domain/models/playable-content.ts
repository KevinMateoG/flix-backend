export interface PlayableContent {
  tmdbId: number;
  muxPlaybackId: string;
  muxAssetId: string | null;
  availableRegions: string[] | null;
  isActive?: boolean;
}

export interface CreatePlayableContentInput {
  tmdbId: number;
  muxPlaybackId: string;
  muxAssetId?: string | null;
  availableRegions?: string[];
}

export interface UpdatePlayableContentInput {
  muxPlaybackId?: string;
  muxAssetId?: string | null;
  availableRegions?: string[];
  isActive?: boolean;
}

export interface CatalogFilterOptions {
  region?: string;
  search?: string;
  tmdbId?: number;
}

export interface StreamInfo extends PlayableContent {
  streamUrl: string | null;
}