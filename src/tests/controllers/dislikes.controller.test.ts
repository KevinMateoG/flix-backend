import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockValues = vi.fn();
  const mockInsert = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn();

  return {
    mockLimit,
    mockWhere,
    mockFrom,
    mockSelect,
    mockValues,
    mockInsert,
    mockDeleteWhere,
    mockDelete,
  };
});

vi.mock('../../db/db.ts', () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    delete: mocks.mockDelete,
  },
}));

vi.mock('../../db/schema.ts', () => ({
  dislikes: {
    id: 'id',
    profileId: 'profile_id',
    tmdbId: 'tmdb_id',
    mediaType: 'media_type',
    addedAt: 'added_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_field: unknown, _val: unknown) => ({ type: 'eq' })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
}));

import {
  toggle_dislike,
  check_if_disliked,
} from '../../controllers/dislikes.controller.ts';

describe('toggle_dislike', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockLimit.mockResolvedValue([]);
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });

    mocks.mockValues.mockResolvedValue(undefined);
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });

    mocks.mockDeleteWhere.mockResolvedValue(undefined);
    mocks.mockDelete.mockReturnValue({ where: mocks.mockDeleteWhere });
  });

  it('returns { added: true } when item does not exist (inserts)', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);

    const result = await toggle_dislike('profile-1', 100, 'movie');

    expect(result).toEqual({ added: true });
    expect(mocks.mockInsert).toHaveBeenCalled();
  });

  it('returns { added: false } when item already exists (deletes)', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ id: 42 }]);

    const result = await toggle_dislike('profile-1', 100, 'movie');

    expect(result).toEqual({ added: false });
    expect(mocks.mockDelete).toHaveBeenCalled();
  });
});

describe('check_if_disliked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns true when a matching record exists', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ id: 1 }]);

    const result = await check_if_disliked('profile-1', 100, 'movie');

    expect(result).toBe(true);
  });

  it('returns false when no matching record exists', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);

    const result = await check_if_disliked('profile-1', 100, 'movie');

    expect(result).toBe(false);
  });
});
