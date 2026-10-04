import { describe, expect, it } from 'vitest';
import { getReviewState, REVIEW_INTERVAL_DAYS } from './staleness';

const now = new Date('2026-09-26T12:00:00Z');

describe('getReviewState', () => {
  it('flags records that were never reviewed', () => {
    expect(getReviewState({ lastReviewedAt: null }, now)).toEqual({ kind: 'never-reviewed' });
  });

  it('treats a review within the interval as current', () => {
    expect(getReviewState({ lastReviewedAt: '2026-09-01T10:00:00Z' }, now)).toEqual({
      kind: 'current',
      daysSinceReview: 25,
    });
  });

  it('is current on the last day of the interval and stale the day after', () => {
    const boundary = new Date(now);
    boundary.setUTCDate(boundary.getUTCDate() - REVIEW_INTERVAL_DAYS);
    expect(getReviewState({ lastReviewedAt: boundary.toISOString() }, now).kind).toBe('current');
    boundary.setUTCDate(boundary.getUTCDate() - 1);
    expect(getReviewState({ lastReviewedAt: boundary.toISOString() }, now).kind).toBe('stale');
  });
});
