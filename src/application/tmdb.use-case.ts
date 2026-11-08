import { AppError } from "./errors/app.error.ts";
import { normalizePage, type PaginatedResult } from "./pagination.ts";
import { type MediaType } from "../domain/models/library-item.ts";

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
    if (!query || query.trim().length < 2) {
      return { results: [] };
    }

    return this.tmdbGateway.search(
      query.trim(),
      normalizePage(page, 1),
      language || "en-US",
    );
  }

  async getTrending(
    mediaType: TmdbTrendingMediaType = "all",
    timeWindow: TmdbTimeWindow = "week",
    language = "en-US",
  ): Promise<PaginatedResult> {
    return this.tmdbGateway.trending(
      mediaType || "all",
      timeWindow || "week",
      language || "en-US",
    );
  }

  async getPopular(
    mediaType: MediaType = "movie",
    page?: number,
    region = "US",
    language = "en-US",
  ): Promise<PaginatedResult> {
    return this.tmdbGateway.popular(
      mediaType || "movie",
      normalizePage(page, 1),
      region || "US",
      language || "en-US",
    );
  }

  async getTopRated(
    mediaType: MediaType = "movie",
    page?: number,
    region = "US",
    language = "en-US",
  ): Promise<PaginatedResult> {
    return this.tmdbGateway.topRated(
      mediaType || "movie",
      normalizePage(page, 1),
      region || "US",
      language || "en-US",
    );
  }

  async getMovieDetails(
    id: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails> {
    if (isNaN(id)) {
      throw AppError.badRequest("id must be a number");
    }
    return this.tmdbGateway.movieDetails(id, language || "en-US");
  }

  async getTvDetails(
    id: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails> {
    if (isNaN(id)) {
      throw AppError.badRequest("id must be a number");
    }
    return this.tmdbGateway.tvDetails(id, language || "en-US");
  }

  async getSeasonDetails(
    tvId: number,
    season: number,
    language = "en-US",
  ): Promise<Record<string, unknown>> {
    if (isNaN(tvId) || isNaN(season)) {
      throw AppError.badRequest("id and season must be numbers");
    }
    return this.tmdbGateway.seasonDetails(tvId, season, language || "en-US");
  }

  async fetchTmdbDetails(
    tmdbId: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails & { media_type: MediaType }> {
    if (isNaN(tmdbId)) {
      throw AppError.badRequest("tmdbId must be a number");
    }

    const resolvedLanguage = language || "en-US";

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
