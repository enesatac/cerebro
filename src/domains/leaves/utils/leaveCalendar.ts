import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { IsoDate } from '@/domains/shared/types';
import { toIsoDate } from '@/lib/dates';
import type { LeaveRecord } from '../types';

/** How much of the calendar is visible at once. */
export const CALENDAR_RANGES = ['2w', '1m', '3m'] as const;
export type CalendarRange = (typeof CALENDAR_RANGES)[number];

export interface CalendarPeriod {
  from: IsoDate;
  to: IsoDate;
}

export interface CalendarDay {
  date: IsoDate;
  dayOfMonth: number;
  weekend: boolean;
  today: boolean;
  /** First day of a month (a visual separator in the grid). */
  monthStart: boolean;
}

export interface CalendarMonth {
  /** First visible day of the month in the period. */
  firstDay: IsoDate;
  /** Number of visible days of that month. */
  span: number;
}

/** A leave clipped to the visible period, positioned on the day columns. */
export interface LeaveSegment {
  leave: LeaveRecord;
  /** Zero-based index of the first visible day. */
  start: number;
  /** Visible days covered. */
  span: number;
  /** The leave started before / ends after the visible period. */
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export type TimelineCell =
  { kind: 'empty'; index: number } | { kind: 'leave'; segment: LeaveSegment };

const day = (value: IsoDate) => parseISO(value);

/**
 * The visible period for a range around `anchor`: two weeks from the anchor's Monday, the
 * anchor's calendar month, or that month plus the next two.
 */
export function periodFor(range: CalendarRange, anchor: IsoDate): CalendarPeriod {
  const date = day(anchor);
  if (range === '2w') {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 13)) };
  }
  const first = startOfMonth(date);
  const last = endOfMonth(range === '1m' ? date : addMonths(date, 2));
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

/** Monday–Sunday week containing `date` (for "who is away this week"). */
export function weekOf(date: IsoDate): CalendarPeriod {
  const monday = startOfWeek(day(date), { weekStartsOn: 1 });
  return { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 6)) };
}

/** Anchor of the previous (`-1`) or next (`1`) period. */
export function shiftAnchor(range: CalendarRange, anchor: IsoDate, direction: -1 | 1): IsoDate {
  const date = day(anchor);
  if (range === '2w') return toIsoDate(addDays(date, 14 * direction));
  return toIsoDate(addMonths(date, (range === '1m' ? 1 : 3) * direction));
}

export function calendarDays(period: CalendarPeriod, today: IsoDate): CalendarDay[] {
  return eachDayOfInterval({ start: day(period.from), end: day(period.to) }).map((date) => {
    const iso = toIsoDate(date);
    return {
      date: iso,
      dayOfMonth: date.getDate(),
      weekend: isWeekend(date),
      today: iso === today,
      monthStart: date.getDate() === 1,
    };
  });
}

/** Month headings spanning their visible days. */
export function calendarMonths(days: readonly CalendarDay[]): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  for (const current of days) {
    const last = months.at(-1);
    if (last && last.firstDay.slice(0, 7) === current.date.slice(0, 7)) last.span += 1;
    else months.push({ firstDay: current.date, span: 1 });
  }
  return months;
}

/** Weekdays in `[start, end]`, i.e. leave days actually used (public holidays not modelled). */
export function workingDays(start: IsoDate, end: IsoDate): number {
  if (end < start) return 0;
  return eachDayOfInterval({ start: day(start), end: day(end) }).filter((d) => !isWeekend(d))
    .length;
}

export const calendarDaysBetween = (start: IsoDate, end: IsoDate) =>
  differenceInCalendarDays(day(end), day(start)) + 1;

export const overlaps = (a: CalendarPeriod, b: CalendarPeriod) => a.from <= b.to && b.from <= a.to;

/** Visible parts of one person's leaves, in date order. Overlapping leaves are not expected. */
export function leaveSegments(
  leaves: readonly LeaveRecord[],
  period: CalendarPeriod,
): LeaveSegment[] {
  return leaves
    .filter((leave) => overlaps({ from: leave.startDate, to: leave.endDate }, period))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((leave) => {
      const from = leave.startDate < period.from ? period.from : leave.startDate;
      const to = leave.endDate > period.to ? period.to : leave.endDate;
      return {
        leave,
        start: differenceInCalendarDays(day(from), day(period.from)),
        span: calendarDaysBetween(from, to),
        continuesBefore: leave.startDate < period.from,
        continuesAfter: leave.endDate > period.to,
      };
    });
}

/** Table cells of a person's row: one per free day, one spanning cell per leave. */
export function timelineCells(segments: readonly LeaveSegment[], dayCount: number): TimelineCell[] {
  const cells: TimelineCell[] = [];
  let index = 0;
  for (const segment of segments) {
    if (segment.start < index) continue; // defensive: overlapping data is rejected on write
    for (; index < segment.start; index += 1) cells.push({ kind: 'empty', index });
    cells.push({ kind: 'leave', segment });
    index = segment.start + segment.span;
  }
  for (; index < dayCount; index += 1) cells.push({ kind: 'empty', index });
  return cells;
}

/** People on leave on `date`. */
export function peopleOnLeave(leaves: readonly LeaveRecord[], date: IsoDate): Set<number> {
  return new Set(
    leaves
      .filter((leave) => leave.startDate <= date && date <= leave.endDate)
      .map((leave) => leave.personId),
  );
}
