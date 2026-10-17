import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockReturning = vi.fn();
  const mockSet = vi.fn();
  const mockUpdate = vi.fn();

  return {
    mockLimit,
    mockWhere,
    mockFrom,
    mockSelect,
    mockReturning,
    mockSet,
    mockUpdate,
  };
});

vi.mock('../../db/db.ts', () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
  },
}));

vi.mock('../../db/schema.ts', () => ({
  profiles: {
    id: 'id',
    region: 'region',
    language: 'language',
    maturityRating: 'maturity_rating',
    isKids: 'is_kids',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_f: unknown, _v: unknown) => ({ type: 'eq' })),
}));

import {
  get_profile,
  update_profile_region,
  update_profile_settings,
} from '../../controllers/profile.controller.ts';

describe('get_profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns the profile when found', async () => {
    const mockProfile = { id: 'user-1', region: 'US', language: 'en-US' };
    mocks.mockLimit.mockResolvedValueOnce([mockProfile]);

    const result = await get_profile('user-1');
    expect(result).toEqual(mockProfile);
  });

  it('returns null when profile not found', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await get_profile('unknown-user');
    expect(result).toBeNull();
  });
});

describe('update_profile_region', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockWhereChain = vi.fn().mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockSet.mockReturnValue({ where: mockWhereChain });
    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
  });

  it('returns the updated profile', async () => {
    const updated = { id: 'user-1', region: 'MX' };
    mocks.mockReturning.mockResolvedValueOnce([updated]);

    const result = await update_profile_region('user-1', 'MX');
    expect(result).toEqual(updated);
  });

  it('returns null when no profile was updated', async () => {
    mocks.mockReturning.mockResolvedValueOnce([]);
    const result = await update_profile_region('unknown-user', 'MX');
    expect(result).toBeNull();
  });
});

describe('update_profile_settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockWhereChain = vi.fn().mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockSet.mockReturnValue({ where: mockWhereChain });
    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
  });

  it('returns null when no valid fields are provided', async () => {
    const result = await update_profile_settings('user-1', {});
    expect(result).toBeNull();
    expect(mocks.mockUpdate).not.toHaveBeenCalled();
  });

  it('returns the updated profile when valid fields are provided', async () => {
    const updated = { id: 'user-1', language: 'es-ES' };
    mocks.mockReturning.mockResolvedValueOnce([updated]);

    const result = await update_profile_settings('user-1', { language: 'es-ES' });
    expect(result).toEqual(updated);
    expect(mocks.mockUpdate).toHaveBeenCalled();
  });

  it('returns null when the DB returns no rows', async () => {
    mocks.mockReturning.mockResolvedValueOnce([]);
    const result = await update_profile_settings('user-1', { isKids: true });
    expect(result).toBeNull();
  });
});
