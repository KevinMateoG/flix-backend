import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';

// ── Mock auth middleware ──────────────────────────────────────────────────────
vi.mock('../../middleware/auth.middleware.ts', () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// ── Mock controllers ─────────────────────────────────────────────────────────
vi.mock('../../controllers/my-list.controller.ts', () => ({
  toggle_my_list: vi.fn(),
  get_my_list: vi.fn(),
  remove_from_my_list: vi.fn(),
  check_if_in_my_list: vi.fn(),
}));

// Silence transitive imports
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }));
vi.mock('better-auth/node', () => ({ fromNodeHeaders: vi.fn() }));

import {
  toggle_my_list,
  get_my_list,
  remove_from_my_list,
  check_if_in_my_list,
} from '../../controllers/my-list.controller.ts';
import myListRouter from '../../routes/my-list.route.ts';

const app = express();
app.use(express.json());
app.use('/api/my-list', myListRouter);

const mockToggle = vi.mocked(toggle_my_list);
const mockGetList = vi.mocked(get_my_list);
const mockRemove = vi.mocked(remove_from_my_list);
const mockCheck = vi.mocked(check_if_in_my_list);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/my-list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with the list', async () => {
    const items = [{ id: 1, tmdbId: 100, mediaType: 'movie' }];
    mockGetList.mockResolvedValueOnce(items as any);

    const res = await request(app).get('/api/my-list');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
  });
});

describe('POST /api/my-list/toggle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId or mediaType is missing', async () => {
    const res = await request(app).post('/api/my-list/toggle').send({ tmdbId: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId and mediaType are required/i);
  });

  it('returns { added: true } when item is added', async () => {
    mockToggle.mockResolvedValueOnce({ added: true });

    const res = await request(app)
      .post('/api/my-list/toggle')
      .send({ tmdbId: 100, mediaType: 'movie' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: true });
  });

  it('returns { added: false } when item is removed', async () => {
    mockToggle.mockResolvedValueOnce({ added: false });

    const res = await request(app)
      .post('/api/my-list/toggle')
      .send({ tmdbId: 100, mediaType: 'movie' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: false });
  });
});

describe('DELETE /api/my-list/:itemId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when itemId is not a number', async () => {
    const res = await request(app).delete('/api/my-list/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/itemId must be a number/i);
  });

  it('returns 404 when item is not found', async () => {
    mockRemove.mockResolvedValueOnce(false);

    const res = await request(app).delete('/api/my-list/999');
    expect(res.status).toBe(404);
  });

  it('returns { success: true } when item is deleted', async () => {
    mockRemove.mockResolvedValueOnce(true);

    const res = await request(app).delete('/api/my-list/5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe('GET /api/my-list/check', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when tmdbId or mediaType is missing', async () => {
    const res = await request(app).get('/api/my-list/check?tmdbId=abc');
    expect(res.status).toBe(400);
  });

  it('returns { inList: true } when item is in the list', async () => {
    mockCheck.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/my-list/check?tmdbId=100&mediaType=movie');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ inList: true });
  });

  it('returns { inList: false } when item is not in the list', async () => {
    mockCheck.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/my-list/check?tmdbId=100&mediaType=movie');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ inList: false });
  });
});
