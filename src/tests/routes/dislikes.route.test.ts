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
vi.mock('../../controllers/dislikes.controller.ts', () => ({
  toggle_dislike: vi.fn(),
  check_if_disliked: vi.fn(),
}));

// Silence transitive imports
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }));
vi.mock('better-auth/node', () => ({ fromNodeHeaders: vi.fn() }));

import {
  toggle_dislike,
  check_if_disliked,
} from '../../controllers/dislikes.controller.ts';
import dislikesRouter from '../../routes/dislikes.route.ts';

const app = express();
app.use(express.json());
app.use('/api/dislikes', dislikesRouter);

const mockToggle = vi.mocked(toggle_dislike);
const mockCheck = vi.mocked(check_if_disliked);

describe('POST /api/dislikes/toggle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId or mediaType is missing', async () => {
    const res = await request(app).post('/api/dislikes/toggle').send({ tmdbId: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId and mediaType are required/i);
  });

  it('returns { added: true } when dislike is toggled on', async () => {
    mockToggle.mockResolvedValueOnce({ added: true });

    const res = await request(app)
      .post('/api/dislikes/toggle')
      .send({ tmdbId: 123, mediaType: 'movie' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: true });
    expect(mockToggle).toHaveBeenCalledWith('test-profile-id', 123, 'movie');
  });

  it('returns { added: false } when dislike is toggled off', async () => {
    mockToggle.mockResolvedValueOnce({ added: false });

    const res = await request(app)
      .post('/api/dislikes/toggle')
      .send({ tmdbId: 123, mediaType: 'movie' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: false });
  });

  it('returns 500 when controller throws', async () => {
    mockToggle.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/dislikes/toggle')
      .send({ tmdbId: 123, mediaType: 'movie' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB failure');
  });
});

describe('GET /api/dislikes/check', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId is missing or NaN', async () => {
    const res = await request(app).get('/api/dislikes/check?mediaType=movie');
    expect(res.status).toBe(400);
  });

  it('returns 400 when mediaType is missing', async () => {
    const res = await request(app).get('/api/dislikes/check?tmdbId=123');
    expect(res.status).toBe(400);
  });

  it('returns { disliked: true } when checked item is disliked', async () => {
    mockCheck.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/dislikes/check?tmdbId=123&mediaType=movie');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ disliked: true });
  });

  it('returns { disliked: false } when checked item is not disliked', async () => {
    mockCheck.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/dislikes/check?tmdbId=123&mediaType=movie');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ disliked: false });
  });
});
