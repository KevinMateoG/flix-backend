import { tmdb } from '../lib/tmdb-client.js';
export async function search_content(query, page = 1, language = 'en-US') {
    return tmdb.search(query, page, language);
}
export async function get_movie_details(id, language = 'en-US') {
    return tmdb.movieDetails(id, language);
}
export async function get_tv_details(id, language = 'en-US') {
    return tmdb.tvDetails(id, language);
}
export async function get_season_details(tvId, season, language = 'en-US') {
    return tmdb.seasonDetails(tvId, season, language);
}
export async function get_trending(mediaType = 'all', timeWindow = 'week', language = 'en-US') {
    return tmdb.trending(mediaType, timeWindow, language);
}
export async function get_popular(mediaType, page = 1, region = 'US', language = 'en-US') {
    return tmdb.popular(mediaType, page, region, language);
}
export async function get_top_rated(mediaType, page = 1, region = 'US', language = 'en-US') {
    return tmdb.topRated(mediaType, page, region, language);
}
export async function fetch_tmdb_details(tmdbId, language = 'en-US') {
    try {
        const movie = await tmdb.movieDetails(tmdbId, language);
        if (movie?.id)
            return { ...movie, media_type: 'movie' };
    }
    catch { }
    try {
        const tv = await tmdb.tvDetails(tmdbId, language);
        if (tv?.id)
            return { ...tv, media_type: 'tv' };
    }
    catch { }
    return null;
}
