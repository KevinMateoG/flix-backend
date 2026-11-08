import { AppError } from "./errors/app.error.ts";
import {
  type LibraryItem,
  type MediaType,
  type ToggleResult,
} from "../domain/models/library-item.ts";
import { type LibraryRepository } from "../domain/repository/library.repository.ts";

export class LibraryUseCase {
  private readonly libraryRepository: LibraryRepository;

  constructor(libraryRepository: LibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  async getMyList(profileId: string): Promise<LibraryItem[]> {
    return this.libraryRepository.getMyList(profileId);
  }

  async toggleMyList(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<ToggleResult> {
    if (!tmdbId || isNaN(tmdbId) || !mediaType) {
      throw AppError.badRequest("tmdbId and mediaType are required");
    }

    const existing = await this.libraryRepository.findMyListItem(
      profileId,
      tmdbId,
      mediaType,
    );

    if (existing) {
      await this.libraryRepository.removeMyListItemById(existing.id);
      return { added: false };
    }

    await this.libraryRepository.addMyListItem(
      profileId,
      tmdbId,
      mediaType,
      new Date(),
    );
    return { added: true };
  }

  async removeFromMyList(
    profileId: string,
    itemId: number,
  ): Promise<{ success: boolean }> {
    if (isNaN(itemId)) {
      throw AppError.badRequest("itemId must be a number");
    }

    const deleted = await this.libraryRepository.removeMyListItemForProfile(
      itemId,
      profileId,
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
    if (isNaN(tmdbId) || !mediaType) {
      throw AppError.badRequest("tmdbId and mediaType are required");
    }

    const existing = await this.libraryRepository.findMyListItem(
      profileId,
      tmdbId,
      mediaType,
    );
    return { inList: Boolean(existing) };
  }

  async toggleDislike(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<ToggleResult> {
    if (!tmdbId || isNaN(tmdbId) || !mediaType) {
      throw AppError.badRequest("tmdbId and mediaType are required");
    }

    const existing = await this.libraryRepository.findDislikeItem(
      profileId,
      tmdbId,
      mediaType,
    );

    if (existing) {
      await this.libraryRepository.removeDislikeItemById(existing.id);
      return { added: false };
    }

    await this.libraryRepository.addDislikeItem(
      profileId,
      tmdbId,
      mediaType,
      new Date(),
    );
    return { added: true };
  }

  async checkIfDisliked(
    profileId: string,
    tmdbId: number,
    mediaType?: MediaType,
  ): Promise<{ disliked: boolean }> {
    if (isNaN(tmdbId) || !mediaType) {
      throw AppError.badRequest("tmdbId and mediaType are required");
    }

    const existing = await this.libraryRepository.findDislikeItem(
      profileId,
      tmdbId,
      mediaType,
    );
    return { disliked: Boolean(existing) };
  }
}
