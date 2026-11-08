export type MediaType = "movie" | "tv";

export interface LibraryItem {
  id: number;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  addedAt: Date | null;
}

export interface ToggleResult {
  added: boolean;
}
