import { describe, expect, it } from 'vitest';
import { daysSince, formatDate, formatRelative } from './dates';

describe('dates', () => {
  it('formats ISO dates consistently', () => {
    expect(formatDate('2026-03-14')).toBe('14 Mar 2026');
  });

  it('returns the fallback for missing or invalid values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date', 'n/a')).toBe('n/a');
  });

  it('formats relative times against an explicit clock', () => {
    expect(formatRelative('2026-09-23T00:00:00Z', new Date('2026-09-26T00:00:00Z'))).toBe(
      '3 gün önce',
    );
  });

  it('counts calendar days since a date', () => {
    expect(daysSince('2026-09-20', new Date('2026-09-26T08:00:00'))).toBe(6);
    expect(daysSince(null)).toBeNull();
  });
});
