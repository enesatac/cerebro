import { describe, expect, it } from 'vitest';
import type { LeaveRecord } from '../types';
import {
  calendarDays,
  calendarMonths,
  leaveSegments,
  peopleOnLeave,
  periodFor,
  shiftAnchor,
  timelineCells,
  workingDays,
} from './leaveCalendar';

const leave = (id: number, personId: number, startDate: string, endDate: string): LeaveRecord => ({
  id,
  personId,
  type: 'annual',
  startDate,
  endDate,
  note: '',
  audit: {
    createdAt: '',
    createdBy: null,
    updatedAt: '',
    updatedBy: null,
    lastReviewedAt: null,
    lastReviewedBy: null,
  },
});

describe('calendar periods', () => {
  it('builds two weeks from Monday, a calendar month, or a quarter', () => {
    expect(periodFor('2w', '2026-09-30')).toEqual({ from: '2026-09-28', to: '2026-10-11' });
    expect(periodFor('1m', '2026-09-30')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodFor('3m', '2026-09-15')).toEqual({ from: '2026-09-01', to: '2026-11-30' });
  });

  it('moves by one period', () => {
    expect(shiftAnchor('2w', '2026-09-28', 1)).toBe('2026-10-12');
    expect(shiftAnchor('1m', '2026-09-28', -1)).toBe('2026-08-28');
    expect(shiftAnchor('3m', '2026-09-28', 1)).toBe('2026-12-28');
  });

  it('marks weekends, today and month starts, and groups days by month', () => {
    const days = calendarDays({ from: '2026-09-28', to: '2026-10-04' }, '2026-09-30');
    expect(days.map((d) => d.dayOfMonth)).toEqual([28, 29, 30, 1, 2, 3, 4]);
    expect(days.filter((d) => d.weekend).map((d) => d.date)).toEqual(['2026-10-03', '2026-10-04']);
    expect(days.find((d) => d.today)?.date).toBe('2026-09-30');
    expect(days.find((d) => d.monthStart)?.date).toBe('2026-10-01');
    expect(calendarMonths(days)).toEqual([
      { firstDay: '2026-09-28', span: 3 },
      { firstDay: '2026-10-01', span: 4 },
    ]);
  });
});

describe('leave arithmetic', () => {
  it('counts weekdays only', () => {
    expect(workingDays('2026-09-28', '2026-10-04')).toBe(5);
    expect(workingDays('2026-10-03', '2026-10-04')).toBe(0);
    expect(workingDays('2026-10-05', '2026-10-01')).toBe(0);
  });

  it('clips leaves to the period and lays a row out as table cells', () => {
    const period = { from: '2026-10-01', to: '2026-10-10' };
    const segments = leaveSegments(
      [
        leave(2, 1, '2026-10-06', '2026-10-15'),
        leave(1, 1, '2026-09-28', '2026-10-02'),
        leave(3, 1, '2026-11-01', '2026-11-02'),
      ],
      period,
    );
    expect(
      segments.map((s) => [s.leave.id, s.start, s.span, s.continuesBefore, s.continuesAfter]),
    ).toEqual([
      [1, 0, 2, true, false],
      [2, 5, 5, false, true],
    ]);
    const cells = timelineCells(segments, 10);
    expect(cells.map((c) => (c.kind === 'empty' ? c.index : `L${c.segment.leave.id}`))).toEqual([
      'L1',
      2,
      3,
      4,
      'L2',
    ]);
  });

  it('knows who is away on a given day', () => {
    const all = [leave(1, 7, '2026-10-01', '2026-10-03'), leave(2, 8, '2026-10-05', '2026-10-05')];
    expect([...peopleOnLeave(all, '2026-10-02')]).toEqual([7]);
    expect(peopleOnLeave(all, '2026-10-04').size).toBe(0);
  });
});
