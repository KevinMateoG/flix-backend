export type MediaType = "movie" | "tv";

export interface LibraryItem {
  id: number;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  addedAt: Date | null;
  isActive?: boolean;
}

export interface UpdateLibraryItemInput {
  tmdbId?: number;
  mediaType?: MediaType;
  isActive?: boolean;
}

export interface ToggleResult {
  added: boolean;
}