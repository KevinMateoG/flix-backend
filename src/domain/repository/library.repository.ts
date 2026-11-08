import { type LibraryItem, type MediaType } from "../models/library-item.ts";

export interface LibraryRepository {
  getMyList(profileId: string): Promise<LibraryItem[]>;
  findMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null>;
  addMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<void>;
  removeMyListItemById(id: number): Promise<void>;
  removeMyListItemForProfile(
    itemId: number,
    profileId: string,
  ): Promise<boolean>;

  findDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null>;
  addDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<void>;
  removeDislikeItemById(id: number): Promise<void>;
}
