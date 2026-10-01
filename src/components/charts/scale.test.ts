import { describe, expect, it } from 'vitest';
import { niceScale } from './scale';

describe('niceScale', () => {
  it('rounds the top to a clean step', () => {
    expect(niceScale(7)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] });
    expect(niceScale(43)).toEqual({ max: 60, ticks: [0, 20, 40, 60] });
  });

  it('never uses fractional steps for counts, but may for measures', () => {
    expect(niceScale(2).ticks).toEqual([0, 1, 2]);
    expect(niceScale(1.1, 4, false).ticks).toEqual([0, 0.5, 1, 1.5]);
  });

  it('copes with an all-zero series', () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});
