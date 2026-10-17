import { describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return { mockCreate };
});

vi.mock('@mux/mux-node', () => {
  return {
    default: class MockMux {
      video = {
        uploads: {
          create: mocks.mockCreate,
        },
      };
    },
  };
});

import { getSignedPlaybackUrl, createDirectUpload } from '../../lib/mux-client.ts';

describe('mux-client', () => {
  describe('getSignedPlaybackUrl', () => {
    it('returns the HLS streaming url with stream.mux.com by default', async () => {
      const url = await getSignedPlaybackUrl('test-playback-id');
      expect(url).toBe('https://stream.mux.com/test-playback-id.m3u8');
    });
  });

  describe('createDirectUpload', () => {
    it('calls mux.video.uploads.create with correct settings', async () => {
      mocks.mockCreate.mockResolvedValueOnce({ id: 'upload-123' });

      const result = await createDirectUpload();

      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          new_asset_settings: { playback_policy: ['public'], test: false },
        })
      );
      expect(result).toEqual({ id: 'upload-123' });
    });
  });
});
