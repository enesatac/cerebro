import { describe, expect, it } from 'vitest';
import type { Allocation } from '../types';
import {
  assignLanes,
  loadLevel,
  loadOn,
  loadSegments,
  peakLoad,
  placeInPeriod,
  planPeriod,
  planScale,
  shiftPlanAnchor,
} from './resourcePlan';

const allocation = (
  id: number,
  startDate: string,
  endDate: string,
  percent: number,
): Allocation => ({
  id,
  personId: 1,
  projectId: id,
  role: 'developer',
  startDate,
  endDate,
  percent,
  note: '',
  audit: {
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: null,
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: null,
    lastReviewedAt: null,
    lastReviewedBy: null,
  },
});

describe('resource plan', () => {
  it('builds whole-month periods and moves by sensible steps', () => {
    expect(planPeriod('3m', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-12-31' });
    expect(planPeriod('12m', '2026-10-15').to).toBe('2027-09-30');
    expect(shiftPlanAnchor('6m', '2026-10-15', 1)).toBe('2027-01-01');
    expect(shiftPlanAnchor('1m', '2026-10-15', -1)).toBe('2026-09-01');
  });

  it('clips placements to the period', () => {
    const period = planPeriod('1m', '2026-10-01');
    expect(placeInPeriod('2026-09-20', '2026-10-03', period)).toEqual({
      offset: 0,
      span: 3,
      continuesBefore: true,
      continuesAfter: false,
    });
    expect(placeInPeriod('2026-11-02', '2026-11-03', period)).toBeNull();
  });

  it('stacks parallel work into the fewest lanes', () => {
    const { lanes, laneCount } = assignLanes([
      allocation(1, '2026-10-01', '2026-10-31', 50),
      allocation(2, '2026-10-10', '2026-11-30', 40),
      allocation(3, '2026-11-01', '2026-11-30', 30),
    ]);
    expect(laneCount).toBe(2);
    expect(lanes.get(1)).toBe(0);
    expect(lanes.get(2)).toBe(1);
    expect(lanes.get(3)).toBe(0);
  });

  it('sums daily load, merges equal runs and finds the peak', () => {
    const items = [
      allocation(1, '2026-10-01', '2026-10-31', 60),
      allocation(2, '2026-10-10', '2026-10-20', 50),
    ];
    expect(loadOn(items, '2026-10-15')).toEqual({ percent: 110, count: 2 });
    const segments = loadSegments(items, planPeriod('1m', '2026-10-01'));
    expect(segments.map((s) => [s.offset, s.span, s.percent])).toEqual([
      [0, 9, 60],
      [9, 11, 110],
      [20, 11, 60],
    ]);
    expect(peakLoad(segments)).toEqual({ percent: 110, count: 2 });
    expect([0, 40, 100, 110].map(loadLevel)).toEqual(['free', 'partial', 'full', 'over']);
  });

  it('labels every day for a month and Mondays for longer views', () => {
    const month = planScale(planPeriod('1m', '2026-10-01'), '1m');
    expect(month.ticks).toHaveLength(31);
    expect(month.months).toEqual([{ date: '2026-10-01', offset: 0, span: 31 }]);
    const quarter = planScale(planPeriod('3m', '2026-10-01'), '3m');
    expect(quarter.ticks[0]?.date).toBe('2026-10-05');
    expect(quarter.months.map((m) => m.span)).toEqual([31, 30, 31]);
  });
});
