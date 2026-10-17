import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mock TMDB controller ─────────────────────────────────────────────────────
vi.mock('../../controllers/tmdb.controller.ts', () => ({
  search_content: vi.fn(),
  get_movie_details: vi.fn(),
  get_tv_details: vi.fn(),
  get_season_details: vi.fn(),
  get_trending: vi.fn(),
  get_popular: vi.fn(),
  get_top_rated: vi.fn(),
  fetch_tmdb_details: vi.fn(),
}));

// Mock heavy deps pulled in transitively
vi.mock('../../lib/tmdb-client.ts', () => ({ tmdb: {} }));
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn(), sql: vi.fn() }));
vi.mock('@mux/mux-node', () => ({ default: vi.fn().mockReturnValue({}) }));
vi.mock('../../lib/mux-client.ts', () => ({ mux: {} }));

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
import tmdbRouter from '../../routes/tmdb.route.ts';

const app = express();
app.use(express.json());
app.use('/api/tmdb', tmdbRouter);

const mockSearch = vi.mocked(search_content);
const mockMovieDetails = vi.mocked(get_movie_details);
const mockTvDetails = vi.mocked(get_tv_details);
const mockSeasonDetails = vi.mocked(get_season_details);
const mockTrending = vi.mocked(get_trending);
const mockPopular = vi.mocked(get_popular);
const mockTopRated = vi.mocked(get_top_rated);
const mockFetchDetails = vi.mocked(fetch_tmdb_details);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/tmdb/search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty results when q is too short (< 2 chars)', async () => {
    const res = await request(app).get('/api/tmdb/search?q=a');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [] });
  });

  it('returns empty results when q is missing', async () => {
    const res = await request(app).get('/api/tmdb/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [] });
  });

  it('returns search results for a valid query', async () => {
    const mockResult = { results: [{ id: 1, title: 'Batman' }] };
    mockSearch.mockResolvedValueOnce(mockResult);

    const res = await request(app).get('/api/tmdb/search?q=batman');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
  });
});

describe('GET /api/tmdb/trending', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns trending data', async () => {
    const mockData = { results: [{ id: 10 }] };
    mockTrending.mockResolvedValueOnce(mockData);

    const res = await request(app).get('/api/tmdb/trending');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
  });
});

describe('GET /api/tmdb/popular', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns popular data', async () => {
    const mockData = { results: [{ id: 20 }] };
    mockPopular.mockResolvedValueOnce(mockData);

    const res = await request(app).get('/api/tmdb/popular');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
  });
});

describe('GET /api/tmdb/top-rated', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns top-rated data', async () => {
    const mockData = { results: [{ id: 30 }] };
    mockTopRated.mockResolvedValueOnce(mockData);

    const res = await request(app).get('/api/tmdb/top-rated');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
  });
});

describe('GET /api/tmdb/movie/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when id is not a number', async () => {
    const res = await request(app).get('/api/tmdb/movie/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/id must be a number/i);
  });

  it('returns movie details for a valid id', async () => {
    const mockMovie = { id: 123, title: 'Inception' };
    mockMovieDetails.mockResolvedValueOnce(mockMovie);

    const res = await request(app).get('/api/tmdb/movie/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockMovie);
  });
});

describe('GET /api/tmdb/tv/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when id is not a number', async () => {
    const res = await request(app).get('/api/tmdb/tv/xyz');
    expect(res.status).toBe(400);
  });

  it('returns tv details for a valid id', async () => {
    const mockShow = { id: 456, name: 'Breaking Bad' };
    mockTvDetails.mockResolvedValueOnce(mockShow);

    const res = await request(app).get('/api/tmdb/tv/456');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockShow);
  });
});

describe('GET /api/tmdb/tv/:id/season/:season', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when id or season is not a number', async () => {
    const res = await request(app).get('/api/tmdb/tv/abc/season/1');
    expect(res.status).toBe(400);
  });

  it('returns season details for valid params', async () => {
    const mockSeason = { id: 789, season_number: 1 };
    mockSeasonDetails.mockResolvedValueOnce(mockSeason);

    const res = await request(app).get('/api/tmdb/tv/456/season/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockSeason);
  });
});

describe('GET /api/tmdb/details/:tmdbId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId is not a number', async () => {
    const res = await request(app).get('/api/tmdb/details/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId must be a number/i);
  });

  it('returns 404 when details are not found', async () => {
    mockFetchDetails.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/tmdb/details/999');
    expect(res.status).toBe(404);
  });

  it('returns details when found', async () => {
    const mockDetails = { id: 100, media_type: 'movie' as const, title: 'Dune' };
    mockFetchDetails.mockResolvedValueOnce(mockDetails);

    const res = await request(app).get('/api/tmdb/details/100');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDetails);
  });
});
