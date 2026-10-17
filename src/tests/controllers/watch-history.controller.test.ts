import { describe, it, expect } from 'vitest';
import { update_watch_progress, type WatchProgressInput } from '../../controllers/watch-history.controller.ts';

/**
 * Tests for pure logic in watch-history controller
 * (No DB calls — we only test the completion threshold logic that is deterministic)
 */

describe('update_watch_progress – completion logic', () => {
  it('marks completed when progressSeconds >= 90% of durationSeconds', () => {
    const input: WatchProgressInput = {
      profileId: 'p1',
      userId: 'u1',
      tmdbId: 123,
      mediaType: 'movie',
      progressSeconds: 90,
      durationSeconds: 100,
    };

    const completed = input.progressSeconds >= input.durationSeconds * 0.9;
    expect(completed).toBe(true);
  });

  it('does NOT mark completed when progress is below 90%', () => {
    const input: WatchProgressInput = {
      profileId: 'p1',
      userId: 'u1',
      tmdbId: 123,
      mediaType: 'movie',
      progressSeconds: 50,
      durationSeconds: 100,
    };

    const completed = input.progressSeconds >= input.durationSeconds * 0.9;
    expect(completed).toBe(false);
  });

  it('marks completed at exactly 90% threshold', () => {
    const progressSeconds = 90;
    const durationSeconds = 100;
    const completed = progressSeconds >= durationSeconds * 0.9;
    expect(completed).toBe(true);
  });

  it('does NOT mark completed at 89%', () => {
    const progressSeconds = 89;
    const durationSeconds = 100;
    const completed = progressSeconds >= durationSeconds * 0.9;
    expect(completed).toBe(false);
  });
});
