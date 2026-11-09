import {
  type CreatePlayableContentInput,
  type PlayableContent,
  type UpdatePlayableContentInput,
} from "../domain/models/playable-content.ts";
import { type EntityStatusFilter } from "../domain/models/user.ts";
import { type PlayableContentRepository } from "../domain/repository/playable-content.repository.ts";
import { AppError } from "./errors/app.error.ts";
import {
  requireNonEmptyString,
  requirePositiveInteger,
} from "./errors/validation.ts";
import {
  buildPaginatedResponse,
  parseStrictPositiveIntParam,
  type StandardPaginatedResponse,
} from "./pagination.ts";

export interface GetCatalogMoviesOptions {
  region?: string;
  search?: string;
  status?: string;
  page?: unknown;
  limit?: unknown;
}

function parseStatusFilter(
  status: string | undefined,
  defaultStatus: EntityStatusFilter = "active",
): EntityStatusFilter {
  if (status === undefined || status === "") return defaultStatus;
  if (status === "active" || status === "inactive" || status === "all") {
    return status;
  }
  throw AppError.badRequest("status must be one of: active, inactive, all");
}

export class CatalogUseCase {
  private readonly playableContentRepository: PlayableContentRepository;

  constructor(playableContentRepository: PlayableContentRepository) {
    this.playableContentRepository = playableContentRepository;
  }

  async getMovies(
    options: GetCatalogMoviesOptions = {},
    defaultStatus: EntityStatusFilter = "active",
  ): Promise<StandardPaginatedResponse<PlayableContent>> {
    const currentPage = parseStrictPositiveIntParam(options.page, "page", 1);
    const limit = parseStrictPositiveIntParam(options.limit, "limit", 10);

    let resolvedRegion: string | undefined;
    if (options.region !== undefined && options.region !== "") {
      resolvedRegion = requireNonEmptyString(options.region, "region");
    }

    const resolvedStatus = parseStatusFilter(options.status, defaultStatus);

    let items = await this.playableContentRepository.findAll(
      resolvedRegion,
      resolvedStatus,
    );

    if (options.search !== undefined && options.search.trim().length > 0) {
      const term = options.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          String(item.tmdbId).includes(term) ||
          item.muxPlaybackId.toLowerCase().includes(term) ||
          (item.muxAssetId?.toLowerCase().includes(term) ?? false),
      );
    }

    return buildPaginatedResponse(items, currentPage, limit);
  }

  async getMovieByTmdbId(
    tmdbId: number,
    includeInactive = false,
  ): Promise<PlayableContent> {
    requirePositiveInteger(tmdbId, "tmdbId");
    const found = await this.playableContentRepository.findByTmdbId(
      tmdbId,
      includeInactive,
    );
    if (!found) {
      throw AppError.notFound("Playable content not found");
    }
    return found;
  }

  async isTitlePlayable(
    tmdbId: number,
    region = "US",
  ): Promise<{ playable: boolean }> {
    requirePositiveInteger(tmdbId, "tmdbId");
    const resolvedRegion =
      region === undefined ? "US" : requireNonEmptyString(region, "region");

    const playable = await this.playableContentRepository.isPlayableInRegion(
      tmdbId,
      resolvedRegion,
    );
    return { playable };
  }

  async createMovie(input: CreatePlayableContentInput): Promise<PlayableContent> {
    requirePositiveInteger(input.tmdbId, "tmdbId");
    const muxPlaybackId = requireNonEmptyString(
      input.muxPlaybackId,
      "muxPlaybackId",
    );

    let availableRegions = ["US"];
    if (input.availableRegions !== undefined) {
      if (
        !Array.isArray(input.availableRegions) ||
        input.availableRegions.length === 0 ||
        !input.availableRegions.every(
          (r) => typeof r === "string" && r.trim().length > 0,
        )
      ) {
        throw AppError.badRequest(
          "availableRegions must be a non-empty array of strings",
        );
      }
      availableRegions = input.availableRegions.map((r) => r.trim().toUpperCase());
    }

    return this.playableContentRepository.create({
      tmdbId: input.tmdbId,
      muxPlaybackId,
      muxAssetId: input.muxAssetId ?? null,
      availableRegions,
    });
  }

  async updateMovie(
    tmdbId: number,
    input: UpdatePlayableContentInput,
  ): Promise<PlayableContent> {
    requirePositiveInteger(tmdbId, "tmdbId");

    const updates: UpdatePlayableContentInput = {};
    if (input.muxPlaybackId !== undefined) {
      updates.muxPlaybackId = requireNonEmptyString(
        input.muxPlaybackId,
        "muxPlaybackId",
      );
    }
    if (input.muxAssetId !== undefined) {
      if (input.muxAssetId !== null && typeof input.muxAssetId !== "string") {
        throw AppError.badRequest("muxAssetId must be a string or null");
      }
      updates.muxAssetId = input.muxAssetId;
    }
    if (input.availableRegions !== undefined) {
      if (
        !Array.isArray(input.availableRegions) ||
        input.availableRegions.length === 0 ||
        !input.availableRegions.every(
          (r) => typeof r === "string" && r.trim().length > 0,
        )
      ) {
        throw AppError.badRequest(
          "availableRegions must be a non-empty array of strings",
        );
      }
      updates.availableRegions = input.availableRegions.map((r) =>
        r.trim().toUpperCase(),
      );
    }
    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") {
        throw AppError.badRequest("isActive must be a boolean");
      }
      updates.isActive = input.isActive;
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest("No valid fields to update");
    }

    const updated = await this.playableContentRepository.update(tmdbId, updates);
    if (!updated) {
      throw AppError.notFound("Playable content not found");
    }
    return updated;
  }

  async deleteMovie(tmdbId: number): Promise<{ success: boolean }> {
    requirePositiveInteger(tmdbId, "tmdbId");
    const deleted = await this.playableContentRepository.softDelete(tmdbId);
    if (!deleted) {
      throw AppError.notFound("Playable content not found");
    }
    return { success: true };
  }
}
