import {
  type LibraryItem,
  type MediaType,
  type ToggleResult,
} from "../../domain/models/library-item.ts";

export interface LibraryToggleRequestDto {
  tmdbId?: number | string;
  mediaType?: MediaType;
}

export interface LibraryCheckQueryDto {
  tmdbId?: string;
  mediaType?: MediaType;
}

export type LibraryItemResponseDto = LibraryItem;
export type ToggleResponseDto = ToggleResult;

export interface InListResponseDto {
  inList: boolean;
}

export interface DislikedResponseDto {
  disliked: boolean;
}

export interface DeleteMyListItemResponseDto {
  success: boolean;
}

export function toLibraryItemResponseDto(
  item: LibraryItem,
): LibraryItemResponseDto {
  return {
    id: item.id,
    profileId: item.profileId,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    addedAt: item.addedAt,
  };
}
