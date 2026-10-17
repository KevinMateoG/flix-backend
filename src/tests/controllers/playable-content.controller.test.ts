import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockGetSignedPlaybackUrl = vi.fn(async (playbackId: string) => `https://stream.mux.com/${playbackId}.m3u8`);

  return {
    mockLimit,
    mockWhere,
    mockFrom,
    mockSelect,
    mockGetSignedPlaybackUrl,
  };
});

vi.mock('../../db/db.ts', () => ({
  db: { select: mocks.mockSelect },
}));

vi.mock('../../db/schema.ts', () => ({
  playableContent: {
    tmdbId: 'tmdb_id',
    muxPlaybackId: 'mux_playback_id',
    muxAssetId: 'mux_asset_id',
    availableRegions: 'available_regions',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_f: unknown, _v: unknown) => ({ type: 'eq' })),
  sql: vi.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ type: 'sql' })),
}));

vi.mock('../../lib/mux-client.ts', () => ({
  getSignedPlaybackUrl: mocks.mockGetSignedPlaybackUrl,
}));

import {
  is_title_playable,
  get_playable_content,
  get_stream_url,
} from '../../controllers/playable-content.controller.ts';

describe('is_title_playable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns true when content is found for the region', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ tmdbId: 100 }]);
    const result = await is_title_playable(100, 'US');
    expect(result).toBe(true);
  });

  it('returns false when no content found', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await is_title_playable(999, 'US');
    expect(result).toBe(false);
  });
});

describe('get_playable_content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns the content object when found', async () => {
    const mockContent = { tmdbId: 100, muxPlaybackId: 'abc123', muxAssetId: 'asset-1', availableRegions: ['US'] };
    mocks.mockLimit.mockResolvedValueOnce([mockContent]);

    const result = await get_playable_content(100);
    expect(result).toEqual(mockContent);
  });

  it('returns null when content is not found', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await get_playable_content(999);
    expect(result).toBeNull();
  });
});

describe('get_stream_url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it('returns the Mux streaming URL when content has a muxPlaybackId', async () => {
    mocks.mockLimit.mockResolvedValueOnce([{ tmdbId: 100, muxPlaybackId: 'playback-xyz' }]);

    const result = await get_stream_url(100);
    expect(result).toBe('https://stream.mux.com/playback-xyz.m3u8');
  });

  it('returns null when no content found', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]);
    const result = await get_stream_url(999);
    expect(result).toBeNull();
  });
});
