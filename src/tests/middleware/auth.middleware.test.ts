import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const mocks = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockFromNodeHeaders = vi.fn((headers: unknown) => headers);

  return {
    mockGetSession,
    mockFromNodeHeaders,
  };
});

vi.mock('../../lib/auth.ts', () => ({
  auth: {
    api: {
      getSession: mocks.mockGetSession,
    },
  },
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: mocks.mockFromNodeHeaders,
}));

// Mock DB and others just in case
vi.mock('../../db/db.ts', () => ({ db: {} }));
vi.mock('../../db/schema.ts', () => ({}));

import { authMiddleware } from '../../middleware/auth.middleware.ts';

describe('authMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {
      headers: { authorization: 'Bearer token123' },
    };
    res = {
      status: statusMock as any,
      json: jsonMock as any,
    };
    next = vi.fn();
  });

  it('responds with 401 Unauthorized if no active session', async () => {
    mocks.mockGetSession.mockResolvedValueOnce(null);

    await authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches userId and sessionId to req and calls next() when session is valid', async () => {
    mocks.mockGetSession.mockResolvedValueOnce({
      user: { id: 'user_xyz' },
      session: { id: 'session_abc' },
    });

    await authMiddleware(req as Request, res as Response, next);

    expect((req as any).userId).toBe('user_xyz');
    expect((req as any).sessionId).toBe('session_abc');
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });
});
