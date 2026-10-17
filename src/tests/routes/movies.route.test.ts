import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mock controllers ─────────────────────────────────────────────────────────
vi.mock('../../controllers/getmovies.controller.ts', () => ({
  default: vi.fn(),
}));

vi.mock('../../controllers/playable-content.controller.ts', () => ({
  is_title_playable: vi.fn(),
  get_playable_content: vi.fn(),
  get_stream_url: vi.fn(),
}));

// Mock auth, db, schema and drizzle (pulled in transitively)
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn(), sql: vi.fn() }));
vi.mock('@mux/mux-node', () => ({ default: vi.fn().mockReturnValue({}) }));
vi.mock('../../lib/mux-client.ts', () => ({ getSignedPlaybackUrl: vi.fn(), mux: {} }));

import get_movies from '../../controllers/getmovies.controller.ts';
import {
  is_title_playable,
  get_playable_content,
  get_stream_url,
} from '../../controllers/playable-content.controller.ts';
import moviesRouter from '../../routes/movies.route.ts';

// Build a minimal app for testing
const app = express();
app.use(express.json());
app.use('/api/movies', moviesRouter);

const mockGetMovies = vi.mocked(get_movies);
const mockIsPlayable = vi.mocked(is_title_playable);
const mockGetPlayable = vi.mocked(get_playable_content);
const mockGetStreamUrl = vi.mocked(get_stream_url);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/movies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with an array of movies', async () => {
    const movies = [{ tmdbId: 1 }, { tmdbId: 2 }];
    mockGetMovies.mockResolvedValueOnce(movies as any);

    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(movies);
  });

  it('returns 500 on controller error', async () => {
    mockGetMovies.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/movies/:tmdbId/playable', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId is not a number', async () => {
    const res = await request(app).get('/api/movies/abc/playable');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId must be a number/i);
  });

  it('returns { playable: true } for a playable title', async () => {
    mockIsPlayable.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/movies/100/playable?region=US');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ playable: true });
  });

  it('returns { playable: false } for a non-playable title', async () => {
    mockIsPlayable.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/movies/999/playable?region=US');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ playable: false });
  });
});

describe('GET /api/movies/:tmdbId/stream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId is not a number', async () => {
    const res = await request(app).get('/api/movies/abc/stream');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId must be a number/i);
  });

  it('returns 404 when no playable content found', async () => {
    mockGetPlayable.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/movies/999/stream');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns stream info when content exists', async () => {
    const content = {
      tmdbId: 100,
      muxPlaybackId: 'play-abc',
      muxAssetId: 'asset-1',
      availableRegions: ['US'],
    };
    mockGetPlayable.mockResolvedValueOnce(content as any);
    mockGetStreamUrl.mockResolvedValueOnce('https://stream.mux.com/play-abc.m3u8');

    const res = await request(app).get('/api/movies/100/stream');
    expect(res.status).toBe(200);
    expect(res.body.tmdbId).toBe(100);
    expect(res.body.streamUrl).toBe('https://stream.mux.com/play-abc.m3u8');
  });
});
