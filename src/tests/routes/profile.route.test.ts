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
vi.mock('../../controllers/profile.controller.ts', () => ({
  get_profile: vi.fn(),
  update_profile_region: vi.fn(),
  update_profile_settings: vi.fn(),
}));

// Silence transitive heavy imports
vi.mock('../../lib/auth.ts', () => ({ auth: {} }));
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));
vi.mock('better-auth/node', () => ({ fromNodeHeaders: vi.fn() }));

import {
  get_profile,
  update_profile_region,
  update_profile_settings,
} from '../../controllers/profile.controller.ts';
import profileRouter from '../../routes/profile.route.ts';

const app = express();
app.use(express.json());
app.use('/api/profile', profileRouter);

const mockGetProfile = vi.mocked(get_profile);
const mockUpdateRegion = vi.mocked(update_profile_region);
const mockUpdateSettings = vi.mocked(update_profile_settings);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/profile/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when profile is not found', async () => {
    mockGetProfile.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/profile/me');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Profile not found/i);
  });

  it('returns 200 with profile data when found', async () => {
    const mockProfile = { id: 'test-user-id', region: 'US', language: 'en-US' };
    mockGetProfile.mockResolvedValueOnce(mockProfile as any);

    const res = await request(app).get('/api/profile/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProfile);
  });
});

describe('PATCH /api/profile/region', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when region is missing', async () => {
    const res = await request(app).patch('/api/profile/region').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/region is required/i);
  });

  it('returns 400 when region is not a string', async () => {
    const res = await request(app).patch('/api/profile/region').send({ region: 123 });
    expect(res.status).toBe(400);
  });

  it('returns the updated profile on success', async () => {
    const updated = { id: 'test-user-id', region: 'MX' };
    mockUpdateRegion.mockResolvedValueOnce(updated as any);

    const res = await request(app).patch('/api/profile/region').send({ region: 'MX' });
    expect(res.status).toBe(200);
    expect(res.body.region).toBe('MX');
  });
});

describe('PATCH /api/profile/settings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when no valid fields are provided', async () => {
    mockUpdateSettings.mockResolvedValueOnce(null);

    const res = await request(app).patch('/api/profile/settings').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No valid fields/i);
  });

  it('returns the updated profile when valid fields are provided', async () => {
    const updated = { id: 'test-user-id', language: 'es-ES' };
    mockUpdateSettings.mockResolvedValueOnce(updated as any);

    const res = await request(app)
      .patch('/api/profile/settings')
      .send({ language: 'es-ES' });
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('es-ES');
  });
});
