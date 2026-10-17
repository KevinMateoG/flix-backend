import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';

// ── Mock auth middleware ──────────────────────────────────────────────────────
vi.mock('../../middleware/auth.middleware.ts', () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = 'test-profile-id';
    next();
  },
}));

// ── Mock controllers ─────────────────────────────────────────────────────────
vi.mock('../../controllers/watch-history.controller.ts', () => ({
  update_watch_progress: vi.fn(),
  get_continue_watching: vi.fn(),
  get_season_progress: vi.fn(),
}));

// Silence transitive imports
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn(), gt: vi.fn(), desc: vi.fn(), sql: vi.fn() }));
vi.mock('better-auth/node', () => ({ fromNodeHeaders: vi.fn() }));

import {
  update_watch_progress,
  get_continue_watching,
  get_season_progress,
} from '../../controllers/watch-history.controller.ts';
import watchHistoryRouter from '../../routes/watch-history.route.ts';

const app = express();
app.use(express.json());
app.use('/api/watch-history', watchHistoryRouter);

const mockUpdateProgress = vi.mocked(update_watch_progress);
const mockGetContinueWatching = vi.mocked(get_continue_watching);
const mockGetSeasonProgress = vi.mocked(get_season_progress);

describe('POST /api/watch-history/update-progress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates watch progress and returns 200 { success: true }', async () => {
    mockUpdateProgress.mockResolvedValueOnce(undefined as any);

    const payload = {
      tmdbId: 100,
      mediaType: 'movie',
      progressSeconds: 120,
      durationSeconds: 3600,
      title: 'Inception',
    };

    const res = await request(app)
      .post('/api/watch-history/update-progress')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockUpdateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'test-profile-id',
        userId: 'test-profile-id',
        tmdbId: 100,
        mediaType: 'movie',
        progressSeconds: 120,
        durationSeconds: 3600,
      })
    );
  });

  it('returns 500 when controller throws', async () => {
    mockUpdateProgress.mockRejectedValueOnce(new Error('DB write failed'));

    const res = await request(app)
      .post('/api/watch-history/update-progress')
      .send({ tmdbId: 100 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB write failed');
  });
});

describe('GET /api/watch-history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns continue watching items with default limit', async () => {
    const items = [{ id: 1, tmdbId: 100, progressSeconds: 50 }];
    mockGetContinueWatching.mockResolvedValueOnce(items as any);

    const res = await request(app).get('/api/watch-history');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
    expect(mockGetContinueWatching).toHaveBeenCalledWith('test-profile-id', 10);
  });

  it('uses query limit when provided', async () => {
    mockGetContinueWatching.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/watch-history?limit=5');

    expect(res.status).toBe(200);
    expect(mockGetContinueWatching).toHaveBeenCalledWith('test-profile-id', 5);
  });
});

describe('GET /api/watch-history/:tmdbId/season/:seasonNumber', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId or seasonNumber is NaN', async () => {
    const res = await request(app).get('/api/watch-history/abc/season/xyz');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be numbers/i);
  });

  it('returns season progress on valid params', async () => {
    const progress = [{ episodeNumber: 1, progressSeconds: 500, durationSeconds: 2400 }];
    mockGetSeasonProgress.mockResolvedValueOnce(progress as any);

    const res = await request(app).get('/api/watch-history/100/season/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(progress);
    expect(mockGetSeasonProgress).toHaveBeenCalledWith('test-profile-id', 100, 1);
  });
});
