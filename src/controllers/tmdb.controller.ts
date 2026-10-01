import { tmdb } from '../lib/tmdb-client.ts';

export async function search_content(query: string, page = 1, language = 'en-US') {
  return tmdb.search(query, page, language);
}

export async function get_movie_details(id: number, language = 'en-US') {
  return tmdb.movieDetails(id, language);
}

export async function get_tv_details(id: number, language = 'en-US') {
  return tmdb.tvDetails(id, language);
}

export async function get_season_details(tvId: number, season: number, language = 'en-US') {
  return tmdb.seasonDetails(tvId, season, language);
}

export async function get_trending(
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  language = 'en-US',
) {
  return tmdb.trending(mediaType, timeWindow, language);
}

export async function get_popular(
  mediaType: 'movie' | 'tv',
  page = 1,
  region = 'US',
  language = 'en-US',
) {
  return tmdb.popular(mediaType, page, region, language);
}

export async function get_top_rated(
  mediaType: 'movie' | 'tv',
  page = 1,
  region = 'US',
  language = 'en-US',
) {
  return tmdb.topRated(mediaType, page, region, language);
}

export async function fetch_tmdb_details(
  tmdbId: number,
  language = 'en-US',
): Promise<(any & { media_type: 'movie' | 'tv' }) | null> {
  try {
    const movie = await tmdb.movieDetails(tmdbId, language);
    if (movie?.id) return { ...movie, media_type: 'movie' as const };
  } catch {}

  try {
    const tv = await tmdb.tvDetails(tmdbId, language);
    if (tv?.id) return { ...tv, media_type: 'tv' as const };
  } catch {}

  return null;
}
