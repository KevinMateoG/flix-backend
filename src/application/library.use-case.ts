import { AppError } from "./errors/app.error.ts";
import {
  type LibraryItem,
  type MediaType,
  type ToggleResult,
} from "../domain/models/library-item.ts";
import { type LibraryRepository } from "../domain/repository/library.repository.ts";
import {
  requireMediaType,
  requireNonEmptyString,
  requirePositiveInteger,
} from "./errors/validation.ts";

export class LibraryUseCase {
  private readonly libraryRepository: LibraryRepository;

  constructor(libraryRepository: LibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  async getMyList(profileId: string): Promise<LibraryItem[]> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");

    return this.libraryRepository.getMyList(validProfileId);
  }

  async toggleMyList(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<ToggleResult> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(tmdbId, "tmdbId");
    const validMediaType = requireMediaType(mediaType);

    const existing = await this.libraryRepository.findMyListItem(
      validProfileId,
      tmdbId,
      validMediaType,
    );

    if (existing) {
      await this.libraryRepository.removeMyListItemById(existing.id);
      return { added: false };
    }

    await this.libraryRepository.addMyListItem(
      validProfileId,
      tmdbId,
      validMediaType,
      new Date(),
    );
    return { added: true };
  }

  async removeFromMyList(
    profileId: string,
    itemId: number,
  ): Promise<{ success: boolean }> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(itemId, "itemId");

    const deleted = await this.libraryRepository.removeMyListItemForProfile(
      itemId,
      validProfileId,
    );

    if (!deleted) {
      throw AppError.notFound("Item not found or not owned by user");
    }

    return { success: true };
  }

  async checkIfInMyList(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<{ inList: boolean }> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(tmdbId, "tmdbId");
    const validMediaType = requireMediaType(mediaType);

    const existing = await this.libraryRepository.findMyListItem(
      validProfileId,
      tmdbId,
      validMediaType,
    );
    return { inList: Boolean(existing) };
  }

  async toggleDislike(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<ToggleResult> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(tmdbId, "tmdbId");
    const validMediaType = requireMediaType(mediaType);

    const existing = await this.libraryRepository.findDislikeItem(
      validProfileId,
      tmdbId,
      validMediaType,
    );

    if (existing) {
      await this.libraryRepository.removeDislikeItemById(existing.id);
      return { added: false };
    }

    await this.libraryRepository.addDislikeItem(
      validProfileId,
      tmdbId,
      validMediaType,
      new Date(),
    );
    return { added: true };
  }

  async checkIfDisliked(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<{ disliked: boolean }> {
    const validProfileId = requireNonEmptyString(profileId, "profileId");
    requirePositiveInteger(tmdbId, "tmdbId");
    const validMediaType = requireMediaType(mediaType);

    const existing = await this.libraryRepository.findDislikeItem(
      validProfileId,
      tmdbId,
      validMediaType,
    );
    return { disliked: Boolean(existing) };
  }
}
