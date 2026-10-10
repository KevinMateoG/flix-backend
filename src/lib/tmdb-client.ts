const BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY || '';
const IMG = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const DEFAULT_LANGUAGE = 'en-US';

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}

export const tmdb = {
  trending: (
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week',
    language = DEFAULT_LANGUAGE,
  ) => fetchTMDB(`/trending/${mediaType}/${timeWindow}`, { language }),

  popular: (mediaType: 'movie' | 'tv', page = 1, region = 'US', language = DEFAULT_LANGUAGE) =>
    fetchTMDB(`/${mediaType}/popular`, { language, page: page.toString(), region }),

  topRated: (mediaType: 'movie' | 'tv', page = 1, region = 'US', language = DEFAULT_LANGUAGE) =>
    fetchTMDB(`/${mediaType}/top_rated`, { language, page: page.toString(), region }),

  discover: (params: Record<string, string>, language = DEFAULT_LANGUAGE) =>
    fetchTMDB('/discover/movie', { ...params, language, sort_by: 'popularity.desc' }),

  discoverTV: (params: Record<string, string>, language = DEFAULT_LANGUAGE) =>
    fetchTMDB('/discover/tv', { ...params, language, sort_by: 'popularity.desc' }),

  search: (query: string, page = 1, language = DEFAULT_LANGUAGE) =>
    fetchTMDB('/search/multi', { query, language, page: page.toString(), include_adult: 'false' }),

  movieDetails: (id: number, language = DEFAULT_LANGUAGE) =>
    fetchTMDB(`/movie/${id}`, {
      language,
      append_to_response: 'credits,videos,watch/providers,recommendations',
    }),

  tvDetails: (id: number, language = DEFAULT_LANGUAGE) =>
    fetchTMDB(`/tv/${id}`, {
      language,
      append_to_response: 'credits,videos,watch/providers,recommendations,aggregate_credits',
    }),

  seasonDetails: (tvId: number, seasonNumber: number, language = DEFAULT_LANGUAGE) =>
    fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`, { language }),

  providers: (mediaType: 'movie' | 'tv', id: number) =>
    fetchTMDB(`/${mediaType}/${id}/watch/providers`, {}),

  image: (
    path: string | null,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500',
  ) => (path ? `${IMG}/${size}${path}` : null),

  backdrop: (path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `${IMG}/${size}${path}` : null,
};
