import { AppError } from "./errors/app.error.ts";
import { normalizePage, type PaginatedResult } from "./pagination.ts";
import { type MediaType } from "../domain/models/library-item.ts";
import { type PlayableContentRepository } from "../domain/repository/playable-content.repository.ts";
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
  discover(
    params: Record<string, string>,
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
  private readonly playableContentRepository?: PlayableContentRepository;

  constructor(
    tmdbGateway: TmdbGatewayPort,
    playableContentRepository?: PlayableContentRepository,
  ) {
    this.tmdbGateway = tmdbGateway;
    this.playableContentRepository = playableContentRepository;
  }

  private async filterInactiveResults(
    paginated: PaginatedResult,
  ): Promise<PaginatedResult> {
    if (!this.playableContentRepository || paginated.results.length === 0) {
      return paginated;
    }

    const inactiveItems = await this.playableContentRepository.findAll(
      undefined,
      "inactive",
    );
    if (inactiveItems.length === 0) {
      return paginated;
    }

    const inactiveIds = new Set(inactiveItems.map((item) => item.tmdbId));
    const results = paginated.results.filter((item) => {
      // TMDB movie and TV ids live in separate namespaces; playable content
      // only stores movies, so never hide a TV show that shares an id.
      if (item.media_type === "tv" || item.media_type === "person") {
        return true;
      }
      return !(typeof item.id === "number" && inactiveIds.has(item.id));
    });

    return { ...paginated, results };
  }

  private async assertMovieNotDeactivated(tmdbId: number): Promise<void> {
    if (!this.playableContentRepository) return;
    const record = await this.playableContentRepository.findByTmdbId(
      tmdbId,
      true,
    );
    if (record && record.isActive === false) {
      throw AppError.notFound("Content not available");
    }
  }

  async discoverMovies(
    genre?: string,
    page?: number,
    region = "US",
    language = "en-US",
  ): Promise<PaginatedResult> {
    if (page !== undefined) {
      requirePositiveInteger(page, "page");
    }
    const resolvedRegion = requireNonEmptyString(region, "region");
    const resolvedLanguage = requireNonEmptyString(language, "language");

    const params: Record<string, string> = {
      page: String(normalizePage(page, 1)),
      region: resolvedRegion,
      watch_region: resolvedRegion,
    };
    if (genre && genre !== "all") {
      if (!/^\d+(,\d+)*$/.test(genre)) {
        throw AppError.badRequest("genre must be a numeric TMDB genre id");
      }
      params.with_genres = genre;
    }

    const data = await this.tmdbGateway.discover(params, resolvedLanguage);
    return this.filterInactiveResults(data);
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

    const data = await this.tmdbGateway.search(
      query.trim(),
      normalizePage(page, 1),
      resolvedLanguage,
    );
    return this.filterInactiveResults(data);
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
    const data = await this.tmdbGateway.trending(
      mediaType || "all",
      timeWindow || "week",
      resolvedLanguage,
    );
    return this.filterInactiveResults(data);
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
    const data = await this.tmdbGateway.popular(
      resolvedMediaType,
      normalizePage(page, 1),
      resolvedRegion,
      resolvedLanguage,
    );
    return this.filterInactiveResults(data);
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
    const data = await this.tmdbGateway.topRated(
      resolvedMediaType,
      normalizePage(page, 1),
      resolvedRegion,
      resolvedLanguage,
    );
    return this.filterInactiveResults(data);
  }

  async getMovieDetails(
    id: number,
    language = "en-US",
  ): Promise<TmdbEntityDetails> {
    requirePositiveInteger(id, "id");
    const resolvedLanguage = requireNonEmptyString(language, "language");
    await this.assertMovieNotDeactivated(id);

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
