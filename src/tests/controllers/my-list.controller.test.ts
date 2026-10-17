import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockValues = vi.fn();
  const mockDelete = vi.fn();
  const mockReturning = vi.fn();

  return {
    mockLimit,
    mockOrderBy,
    mockWhere,
    mockFrom,
    mockSelect,
    mockInsert,
    mockValues,
    mockDelete,
    mockReturning,
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
  myList: {
    id: 'id',
    profileId: 'profile_id',
    tmdbId: 'tmdb_id',
    mediaType: 'media_type',
    addedAt: 'added_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_f: unknown, _v: unknown) => ({ type: 'eq' })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
}));

import {
  toggle_my_list,
  get_my_list,
  remove_from_my_list,
  check_if_in_my_list,
} from '../../controllers/my-list.controller.ts';

describe('toggle_my_list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockLimit.mockResolvedValue([]);
    mocks.mockOrderBy.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockWhere.mockReturnValue({ orderBy: mocks.mockOrderBy, limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
    mocks.mockValues.mockResolvedValue(undefined);
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
    mocks.mockDelete.mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mocks.mockReturning }) });
    mocks.mockReturning.mockResolvedValue([]);
  });

  it('returns { added: true } when item is new', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await toggle_my_list('profile-1', 200, 'tv');
    expect(result).toEqual({ added: true });
    expect(mocks.mockInsert).toHaveBeenCalled();
  });

  it('returns { added: false } when item already exists (removes it)', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ id: 7 }]);
    mocks.mockDelete.mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) });

    const result = await toggle_my_list('profile-1', 200, 'tv');
    expect(result).toEqual({ added: false });
    expect(mocks.mockDelete).toHaveBeenCalled();
  });
});

describe('get_my_list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockOrderBy.mockResolvedValue([{ id: 1, tmdbId: 200, mediaType: 'tv' }]);
    mocks.mockWhere.mockReturnValue({ orderBy: mocks.mockOrderBy });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns the list of items for a profile', async () => {
    const result = await get_my_list('profile-1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('remove_from_my_list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockDelete.mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mocks.mockReturning }) });
  });

  it('returns true when item is deleted', async () => {
    mocks.mockReturning.mockResolvedValueOnce([{ id: 5 }]);
    const result = await remove_from_my_list(5, 'profile-1');
    expect(result).toBe(true);
  });

  it('returns false when item does not exist', async () => {
    mocks.mockReturning.mockResolvedValueOnce([]);
    const result = await remove_from_my_list(999, 'profile-1');
    expect(result).toBe(false);
  });
});

describe('check_if_in_my_list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns true when item is in the list', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ id: 3 }]);
    const result = await check_if_in_my_list('profile-1', 200, 'tv');
    expect(result).toBe(true);
  });

  it('returns false when item is not in the list', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await check_if_in_my_list('profile-1', 200, 'tv');
    expect(result).toBe(false);
  });
});
