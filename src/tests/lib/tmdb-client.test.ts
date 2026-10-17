import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmdb } from '../../lib/tmdb-client.ts';

describe('tmdb-client helper functions', () => {
  describe('tmdb.image', () => {
    it('returns null when path is null', () => {
      expect(tmdb.image(null)).toBeNull();
    });

    it('returns formatted URL with default size w500', () => {
      const url = tmdb.image('/poster123.jpg');
      expect(url).toContain('/w500/poster123.jpg');
    });

    it('returns formatted URL with custom size', () => {
      const url = tmdb.image('/poster123.jpg', 'original');
      expect(url).toContain('/original/poster123.jpg');
    });
  });

  describe('tmdb.backdrop', () => {
    it('returns null when path is null', () => {
      expect(tmdb.backdrop(null)).toBeNull();
    });

    it('returns formatted backdrop URL with default size w1280', () => {
      const url = tmdb.backdrop('/backdrop123.jpg');
      expect(url).toContain('/w1280/backdrop123.jpg');
    });

    it('returns formatted backdrop URL with custom size', () => {
      const url = tmdb.backdrop('/backdrop123.jpg', 'w780');
      expect(url).toContain('/w780/backdrop123.jpg');
    });
  });

  describe('fetchTMDB via methods', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls fetch with proper URL and returns JSON on success', async () => {
      const mockData = { id: 123, title: 'Test Movie' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await tmdb.movieDetails(123);
      expect(result).toEqual(mockData);
    });

    it('throws error when fetch response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(tmdb.movieDetails(999)).rejects.toThrow(/TMDB 404/);
    });
  });
});
