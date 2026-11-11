import {
  type TmdbEntityDetails,
  type TmdbGatewayPort,
  type TmdbTimeWindow,
  type TmdbTrendingMediaType,
} from "../../application/tmdb.use-case.ts";
import { type PaginatedResult } from "../../application/pagination.ts";
import { type MediaType } from "../../domain/models/library-item.ts";

const BASE = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY || "";
const IMG = process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";
const DEFAULT_LANGUAGE = "en-US";

async function fetchTMDB<T = Record<string, unknown>>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("api_key", KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export class TmdbService implements TmdbGatewayPort {
  trending(
    mediaType: TmdbTrendingMediaType = "all",
    timeWindow: TmdbTimeWindow = "week",
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>(`/trending/${mediaType}/${timeWindow}`, {
      language,
    });
  }

  popular(
    mediaType: MediaType,
    page = 1,
    region = "US",
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>(`/${mediaType}/popular`, {
      language,
      page: page.toString(),
      region,
    });
  }

  topRated(
    mediaType: MediaType,
    page = 1,
    region = "US",
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>(`/${mediaType}/top_rated`, {
      language,
      page: page.toString(),
      region,
    });
  }

  discover(
    params: Record<string, string>,
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>("/discover/movie", {
      ...params,
      language,
      sort_by: "popularity.desc",
    });
  }

  discoverTV(
    params: Record<string, string>,
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>("/discover/tv", {
      ...params,
      language,
      sort_by: "popularity.desc",
    });
  }

  search(
    query: string,
    page = 1,
    language = DEFAULT_LANGUAGE,
  ): Promise<PaginatedResult> {
    return fetchTMDB<PaginatedResult>("/search/multi", {
      query,
      language,
      page: page.toString(),
      include_adult: "false",
    });
  }

  movieDetails(
    id: number,
    language = DEFAULT_LANGUAGE,
  ): Promise<TmdbEntityDetails> {
    return fetchTMDB<TmdbEntityDetails>(`/movie/${id}`, {
      language,
      append_to_response: "credits,videos,watch/providers,recommendations",
    });
  }

  tvDetails(
    id: number,
    language = DEFAULT_LANGUAGE,
  ): Promise<TmdbEntityDetails> {
    return fetchTMDB<TmdbEntityDetails>(`/tv/${id}`, {
      language,
      append_to_response:
        "credits,videos,watch/providers,recommendations,aggregate_credits",
    });
  }

  seasonDetails(
    tvId: number,
    seasonNumber: number,
    language = DEFAULT_LANGUAGE,
  ): Promise<Record<string, unknown>> {
    return fetchTMDB<Record<string, unknown>>(
      `/tv/${tvId}/season/${seasonNumber}`,
      { language },
    );
  }

  providers(
    mediaType: MediaType,
    id: number,
  ): Promise<Record<string, unknown>> {
    return fetchTMDB<Record<string, unknown>>(
      `/${mediaType}/${id}/watch/providers`,
      {},
    );
  }

  image(
    path: string | null,
    size:
      | "w92"
      | "w154"
      | "w185"
      | "w342"
      | "w500"
      | "w780"
      | "original" = "w500",
  ): string | null {
    return path ? `${IMG}/${size}${path}` : null;
  }

  backdrop(
    path: string | null,
    size: "w300" | "w780" | "w1280" | "original" = "w1280",
  ): string | null {
    return path ? `${IMG}/${size}${path}` : null;
  }
}

export const tmdbService = new TmdbService();
