import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  getDay,
  parseISO,
  startOfMonth,
} from 'date-fns';
import type { IsoDate } from '@/domains/shared/types';
import { toIsoDate } from '@/lib/dates';
import { FULL_LOAD, type Allocation } from '../types';

/** Zoom levels: how many months are visible at once. */
export const PLAN_RANGES = ['1m', '3m', '6m', '12m'] as const;
export type PlanRange = (typeof PLAN_RANGES)[number];

const MONTHS: Record<PlanRange, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
/** Months moved by ‹ / ›: whole views when short, a quarter when long so context carries over. */
const STEP: Record<PlanRange, number> = { '1m': 1, '3m': 1, '6m': 3, '12m': 3 };

export interface PlanPeriod {
  from: IsoDate;
  to: IsoDate;
}

const day = (value: IsoDate) => parseISO(value);

/** Whole months starting with the anchor's month. */
export function planPeriod(range: PlanRange, anchor: IsoDate): PlanPeriod {
  const first = startOfMonth(day(anchor));
  return {
    from: toIsoDate(first),
    to: toIsoDate(endOfMonth(addMonths(first, MONTHS[range] - 1))),
  };
}

export function shiftPlanAnchor(range: PlanRange, anchor: IsoDate, direction: -1 | 1): IsoDate {
  return toIsoDate(addMonths(startOfMonth(day(anchor)), STEP[range] * direction));
}

export const periodDays = (period: PlanPeriod) =>
  differenceInCalendarDays(day(period.to), day(period.from)) + 1;

/** Day offset of `date` from the period start (may be negative or past the end). */
export const dayOffset = (period: PlanPeriod, date: IsoDate) =>
  differenceInCalendarDays(day(date), day(period.from));

export const dateAt = (period: PlanPeriod, offset: number): IsoDate =>
  toIsoDate(addDays(day(period.from), offset));

export const overlapsPeriod = (start: IsoDate, end: IsoDate, period: PlanPeriod) =>
  start <= period.to && period.from <= end;

/** Where a dated item sits inside the period, clipped to it. `null` when it is outside. */
export interface Placement {
  offset: number;
  span: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export function placeInPeriod(start: IsoDate, end: IsoDate, period: PlanPeriod): Placement | null {
  if (!overlapsPeriod(start, end, period)) return null;
  const first = start < period.from ? period.from : start;
  const last = end > period.to ? period.to : end;
  return {
    offset: dayOffset(period, first),
    span: dayOffset(period, last) - dayOffset(period, first) + 1,
    continuesBefore: start < period.from,
    continuesAfter: end > period.to,
  };
}

/**
 * Stacks overlapping allocations into lanes (greedy interval colouring, earliest start first):
 * the number of lanes is the most work the person has in parallel.
 */
export function assignLanes(allocations: readonly Allocation[]): {
  lanes: Map<number, number>;
  laneCount: number;
} {
  const sorted = [...allocations].sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.id - b.id,
  );
  const laneEnds: IsoDate[] = [];
  const lanes = new Map<number, number>();
  for (const allocation of sorted) {
    let lane = laneEnds.findIndex((end) => end < allocation.startDate);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = allocation.endDate;
    lanes.set(allocation.id, lane);
  }
  return { lanes, laneCount: laneEnds.length };
}

export interface Load {
  /** Sum of the allocation percentages. */
  percent: number;
  /** Number of parallel allocations. */
  count: number;
}

/** Load on one day. */
export function loadOn(allocations: readonly Allocation[], date: IsoDate): Load {
  return allocations.reduce<Load>(
    (load, a) =>
      a.startDate <= date && date <= a.endDate
        ? { percent: load.percent + a.percent, count: load.count + 1 }
        : load,
    { percent: 0, count: 0 },
  );
}

/** A run of consecutive days with the same load. */
export interface LoadSegment extends Load {
  offset: number;
  span: number;
}

/** The person's daily load across the period, merged into runs of equal load. */
export function loadSegments(
  allocations: readonly Allocation[],
  period: PlanPeriod,
): LoadSegment[] {
  const total = periodDays(period);
  const segments: LoadSegment[] = [];
  for (let offset = 0; offset < total; offset += 1) {
    const load = loadOn(allocations, dateAt(period, offset));
    const last = segments.at(-1);
    if (last && last.percent === load.percent && last.count === load.count) {
      last.span += 1;
    } else {
      segments.push({ offset, span: 1, ...load });
    }
  }
  return segments;
}

/** Highest load in the segments (most percent; ties broken by parallel count). */
export function peakLoad(segments: readonly LoadSegment[]): Load {
  return segments.reduce<Load>(
    (peak, s) =>
      s.percent > peak.percent || (s.percent === peak.percent && s.count > peak.count)
        ? { percent: s.percent, count: s.count }
        : peak,
    { percent: 0, count: 0 },
  );
}

export type LoadLevel = 'free' | 'partial' | 'full' | 'over';

/** Load band, for colour and wording: nothing, some capacity left, fully used, over-allocated. */
export function loadLevel(percent: number): LoadLevel {
  if (percent <= 0) return 'free';
  if (percent < FULL_LOAD) return 'partial';
  if (percent === FULL_LOAD) return 'full';
  return 'over';
}

export interface ScaleMonth {
  date: IsoDate;
  offset: number;
  span: number;
}

export interface ScaleTick {
  date: IsoDate;
  offset: number;
  /** Day of month shown on the tick. */
  label: number;
  weekend: boolean;
}

/** Month bands and the ticks below them: every day for one month, Mondays otherwise. */
export function planScale(period: PlanPeriod, range: PlanRange) {
  const total = periodDays(period);
  const months: ScaleMonth[] = [];
  const ticks: ScaleTick[] = [];
  for (let offset = 0; offset < total; offset += 1) {
    const date = addDays(day(period.from), offset);
    if (date.getDate() === 1 || offset === 0) {
      const last = months.at(-1);
      if (last) last.span = offset - last.offset;
      months.push({ date: toIsoDate(date), offset, span: total - offset });
    }
    const weekday = getDay(date);
    if (range === '1m' || weekday === 1) {
      ticks.push({
        date: toIsoDate(date),
        offset,
        label: date.getDate(),
        weekend: weekday === 0 || weekday === 6,
      });
    }
  }
  return { months, ticks, total };
}
