import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  return {
    mockWhere,
    mockFrom,
    mockSelect,
  };
});

vi.mock('../../db/db.ts', () => ({
  db: {
    select: mocks.mockSelect,
  },
}));

vi.mock('../../db/schema.ts', () => ({
  playableContent: {
    availableRegions: 'available_regions',
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ type: 'sql' })),
}));

import get_movies from '../../controllers/getmovies.controller.ts';

describe('get_movies controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries all movies when no region is specified', async () => {
    const movies = [{ tmdbId: 1, title: 'Movie 1' }];
    mocks.mockFrom.mockResolvedValueOnce(movies);
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });

    const result = await get_movies();

    expect(result).toEqual(movies);
    expect(mocks.mockSelect).toHaveBeenCalled();
    expect(mocks.mockFrom).toHaveBeenCalled();
  });

  it('filters by region when region is provided', async () => {
    const movies = [{ tmdbId: 2, title: 'Movie 2' }];
    mocks.mockWhere.mockResolvedValueOnce(movies);
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });

    const result = await get_movies('US');

    expect(result).toEqual(movies);
    expect(mocks.mockWhere).toHaveBeenCalled();
  });
});
