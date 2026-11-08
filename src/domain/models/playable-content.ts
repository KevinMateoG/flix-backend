export interface PlayableContent {
  tmdbId: number;
  muxPlaybackId: string;
  muxAssetId: string | null;
  availableRegions: string[] | null;
}

export interface StreamInfo extends PlayableContent {
  streamUrl: string | null;
}
