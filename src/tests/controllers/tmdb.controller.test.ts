import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockSearch = vi.fn();
  const mockMovieDetails = vi.fn();
  const mockTvDetails = vi.fn();
  const mockSeasonDetails = vi.fn();
  const mockTrending = vi.fn();
  const mockPopular = vi.fn();
  const mockTopRated = vi.fn();

  return {
    mockSearch,
    mockMovieDetails,
    mockTvDetails,
    mockSeasonDetails,
    mockTrending,
    mockPopular,
    mockTopRated,
  };
});

vi.mock('../../lib/tmdb-client.ts', () => ({
  tmdb: {
    search: mocks.mockSearch,
    movieDetails: mocks.mockMovieDetails,
    tvDetails: mocks.mockTvDetails,
    seasonDetails: mocks.mockSeasonDetails,
    trending: mocks.mockTrending,
    popular: mocks.mockPopular,
    topRated: mocks.mockTopRated,
  },
}));

import {
  search_content,
  get_movie_details,
  get_tv_details,
  get_season_details,
  get_trending,
  get_popular,
  get_top_rated,
  fetch_tmdb_details,
} from '../../controllers/tmdb.controller.ts';

describe('search_content', () => {
  it('delegates to tmdb.search with correct args', async () => {
    const mockResult = { results: [{ id: 1 }] };
    mocks.mockSearch.mockResolvedValueOnce(mockResult);

    const result = await search_content('batman', 1, 'en-US');
    expect(result).toEqual(mockResult);
    expect(mocks.mockSearch).toHaveBeenCalledWith('batman', 1, 'en-US');
  });

  it('uses default page and language', async () => {
    mocks.mockSearch.mockResolvedValueOnce({ results: [] });
    await search_content('joker');
    expect(mocks.mockSearch).toHaveBeenCalledWith('joker', 1, 'en-US');
  });
});

describe('get_movie_details', () => {
  it('delegates to tmdb.movieDetails', async () => {
    const mockMovie = { id: 123, title: 'Test Movie' };
    mocks.mockMovieDetails.mockResolvedValueOnce(mockMovie);

    const result = await get_movie_details(123);
    expect(result).toEqual(mockMovie);
    expect(mocks.mockMovieDetails).toHaveBeenCalledWith(123, 'en-US');
  });
});

describe('get_tv_details', () => {
  it('delegates to tmdb.tvDetails', async () => {
    const mockTv = { id: 456, name: 'Test Show' };
    mocks.mockTvDetails.mockResolvedValueOnce(mockTv);

    const result = await get_tv_details(456);
    expect(result).toEqual(mockTv);
    expect(mocks.mockTvDetails).toHaveBeenCalledWith(456, 'en-US');
  });
});

describe('get_season_details', () => {
  it('delegates to tmdb.seasonDetails', async () => {
    const mockSeason = { id: 789, season_number: 1 };
    mocks.mockSeasonDetails.mockResolvedValueOnce(mockSeason);

    const result = await get_season_details(456, 1);
    expect(result).toEqual(mockSeason);
    expect(mocks.mockSeasonDetails).toHaveBeenCalledWith(456, 1, 'en-US');
  });
});

describe('get_trending', () => {
  it('uses defaults when no args are provided', async () => {
    mocks.mockTrending.mockResolvedValueOnce({ results: [] });
    await get_trending();
    expect(mocks.mockTrending).toHaveBeenCalledWith('all', 'week', 'en-US');
  });

  it('passes custom args correctly', async () => {
    mocks.mockTrending.mockResolvedValueOnce({ results: [] });
    await get_trending('movie', 'day', 'es-ES');
    expect(mocks.mockTrending).toHaveBeenCalledWith('movie', 'day', 'es-ES');
  });
});

describe('get_popular', () => {
  it('delegates to tmdb.popular', async () => {
    mocks.mockPopular.mockResolvedValueOnce({ results: [] });
    await get_popular('movie', 1, 'US', 'en-US');
    expect(mocks.mockPopular).toHaveBeenCalledWith('movie', 1, 'US', 'en-US');
  });
});

describe('get_top_rated', () => {
  it('delegates to tmdb.topRated', async () => {
    mocks.mockTopRated.mockResolvedValueOnce({ results: [] });
    await get_top_rated('tv', 2, 'US', 'en-US');
    expect(mocks.mockTopRated).toHaveBeenCalledWith('tv', 2, 'US', 'en-US');
  });
});

describe('fetch_tmdb_details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns movie details with media_type="movie" when movie is found', async () => {
    mocks.mockMovieDetails.mockResolvedValueOnce({ id: 100, title: 'Found Movie' });

    const result = await fetch_tmdb_details(100);
    expect(result).toMatchObject({ id: 100, media_type: 'movie' });
  });

  it('falls back to tv and returns with media_type="tv" when movie throws', async () => {
    mocks.mockMovieDetails.mockRejectedValueOnce(new Error('Not a movie'));
    mocks.mockTvDetails.mockResolvedValueOnce({ id: 200, name: 'Found Show' });

    const result = await fetch_tmdb_details(200);
    expect(result).toMatchObject({ id: 200, media_type: 'tv' });
  });

  it('returns null when both movie and tv lookups fail', async () => {
    mocks.mockMovieDetails.mockRejectedValueOnce(new Error('Not a movie'));
    mocks.mockTvDetails.mockRejectedValueOnce(new Error('Not a show'));

    const result = await fetch_tmdb_details(999);
    expect(result).toBeNull();
  });

  it('returns null when movie has no id', async () => {
    mocks.mockMovieDetails.mockResolvedValueOnce({});
    mocks.mockTvDetails.mockRejectedValueOnce(new Error('not found'));

    const result = await fetch_tmdb_details(999);
    expect(result).toBeNull();
  });
});
