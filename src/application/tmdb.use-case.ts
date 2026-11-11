import { AppError } from "./errors/app.error.ts";
import { normalizePage, type PaginatedResult } from "./pagination.ts";
import { type MediaType } from "../domain/models/library-item.ts";
import {
  requireMediaType,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requirePositiveInteger,
} from "./errors/validation.ts";

export type TmdbTrendingMediaType = MediaType | "all";
export type TmdbTimeWindow = "day" | "week";

export interface TmdbEntityDetails extends Record<string, unknown> {
  id?: number;
}

export interface TmdbGatewayPort {
  trending(
    mediaType?: TmdbTrendingMediaType,
    timeWindow?: TmdbTimeWindow,
    language?: string,
  ): Promise<PaginatedResult>;
  popular(
    mediaType: MediaType,
    page?: number,
    region?: string,
    language?: string,
  ): Promise<PaginatedResult>;
  topRated(
    mediaType: MediaType,
    page?: number,
    region?: string,
    language?: string,
  ): Promise<PaginatedResult>;
  search(
    query: string,
    page?: number,
    language?: string,
  ): Promise<PaginatedResult>;
  movieDetails(id: number, language?: string): Promise<TmdbEntityDetails>;
  tvDetails(id: number, language?: string): Promise<TmdbEntityDetails>;
  seasonDetails(
    tvId: number,
    seasonNumber: number,
    language?: string,
  ): Promise<Record<string, unknown>>;
}

export class TmdbUseCase {
  private readonly tmdbGateway: TmdbGatewayPort;

  constructor(tmdbGateway: TmdbGatewayPort) {
    this.tmdbGateway = tmdbGateway;
  }

  async searchContent(
    query?: string,
    page?: number,
    language = "en-US",
  ): Promise<PaginatedResult> {
    if (query !== undefined && typeof query !== "string") {
      throw AppError.badRequest("query must be a string");
    }
    if (page !== undefined) {
      requirePositiveInteger(page, "page");
    }
    const resolvedLanguage = requireNonEmptyString(language, "language");
    if (!query || query.trim().length < 2) {
      return { results: [] };
    }

    return this.tmdbGateway.search(
      query.trim(),
      normalizePage(page, 1),
      resolvedLanguage,
    );
  }

  async getTrending(
    mediaType: TmdbTrendingMediaType = "all",
    timeWindow: TmdbTimeWindow = "week",
    language = "en-US",
  ): Promise<PaginatedResult> {
    if (mediaType !== "all") {
      requireMediaType(mediaType);
    }
    if (timeWindow !== "day" && timeWindow !== "week") {
      throw AppError.badRequest("timeWindow must be day or week");
    }
    const resolvedLanguage = requireNonEmptyString(language, "language");
    return this.tmdbGateway.trending(
      mediaType || "all",
      timeWindow || "week",
      resolvedLanguage,
    );
  }

  async getPopular(
    mediaType: MediaType = "movie",
    page?: number,
    region = "US",
    language = "en-US",
  ): Promise<PaginatedResult> {
    const resolvedMediaType = requireMediaType(mediaType);
    if (page !== undefined) {
      requirePositiveInteger(page, "page");
    }
    const resolvedRegion = requireNonEmptyString(region, "region");
    const resolvedLanguage = requireNonEmptyString(language, "language");
    return this.tmdbGateway.popular(
      resolvedMediaType,
      normalizePage(page, 1),
      resolvedRegion,
      resolvedLanguage,
    );
  }

  async getTopRated(
    mediaType: MediaType = "movie",
    page?: number,
    region = "US",
    language = "en-US",
  ): Promise<PaginatedResult> {
    const resolvedMediaType = requireMediaType(mediaType);
    if (page !== undefined) {
      requirePositiveInteger(page, "page");
    }
    const resolvedRegion = requireNonEmptyString(region, "region");
    const resolvedLanguage = requireNonEmptyString(language, "language");
    return this.tmdbGateway.topRated(
      resolvedMediaType,
      normalizePage(page, 1),
      resolvedRegion,
      resolvedLanguage,
    );
  }

  async getMovieDetails(
    id: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails> {
    requirePositiveInteger(id, "id");
    const resolvedLanguage = requireNonEmptyString(language, "language");

    return this.tmdbGateway.movieDetails(
      id,
      resolvedLanguage,
    );
  }

  async getTvDetails(
    id: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails> {
    requirePositiveInteger(id, "id");
    const resolvedLanguage = requireNonEmptyString(language, "language");

    return this.tmdbGateway.tvDetails(
      id,
      resolvedLanguage,
    );
  }

  async getSeasonDetails(
    tvId: number,
    season: number,
    language = "en-US",
  ): Promise<Record<string, unknown>> {
    requirePositiveInteger(tvId, "id");
    requireNonNegativeInteger(season, "season");
    const resolvedLanguage = requireNonEmptyString(language, "language");

    return this.tmdbGateway.seasonDetails(
      tvId,
      season,
      resolvedLanguage,
    );
  }

  async fetchTmdbDetails(
    tmdbId: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails & { media_type: MediaType }> {
    requirePositiveInteger(tmdbId, "tmdbId");

    const resolvedLanguage = requireNonEmptyString(language, "language");

    try {
      const movie = await this.tmdbGateway.movieDetails(tmdbId, resolvedLanguage);
      if (movie?.id) {
        return { ...movie, media_type: "movie" };
      }
    } catch {
      // Fall through to TV lookup
    }

    try {
      const tv = await this.tmdbGateway.tvDetails(tmdbId, resolvedLanguage);
      if (tv?.id) {
        return { ...tv, media_type: "tv" };
      }
    } catch {
      // Fall through to 404
    }

    throw AppError.notFound("Not found");
  }
}
