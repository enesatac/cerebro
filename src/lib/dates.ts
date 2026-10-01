import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  isValid,
  parseISO,
} from 'date-fns';
import { tr } from 'date-fns/locale';

/** All user-facing date formatting goes through these helpers — never format inline. */

const DATE_FORMAT = 'd MMM yyyy';
const DATE_TIME_FORMAT = 'd MMM yyyy, HH:mm';

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

/** `14 Mar 2026`, or `fallback` for missing/invalid input. */
export function formatDate(value: string | null | undefined, fallback = '—'): string {
  const date = parse(value);
  return date ? format(date, DATE_FORMAT, { locale: tr }) : fallback;
}

/** `14 Mar 2026, 09:30` in the viewer's local time zone. */
export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  const date = parse(value);
  return date ? format(date, DATE_TIME_FORMAT, { locale: tr }) : fallback;
}

/** `3 days ago` / `in 2 months`, relative to `now`. */
export function formatRelative(
  value: string | null | undefined,
  now: Date = new Date(),
  fallback = '—',
): string {
  const date = parse(value);
  return date ? formatDistanceStrict(date, now, { addSuffix: true, locale: tr }) : fallback;
}

/** Whole calendar days from `value` until `now` (positive = in the past). `null` when missing. */
export function daysSince(value: string | null | undefined, now: Date = new Date()): number | null {
  const date = parse(value);
  return date ? differenceInCalendarDays(now, date) : null;
}

/** Calendar date (`yyyy-MM-dd`) in local time — comparable as a string with IsoDate values. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** `toIsoDate(now + days)`. */
export function isoDateInDays(days: number, now: Date = new Date()): string {
  return toIsoDate(addDays(now, days));
}

/** `1–5 Eki 2026`, `28 Eyl – 3 Eki 2026` or `29 Ara 2026 – 2 Oca 2027` (inclusive range). */
export function formatDateRange(start: string, end: string): string {
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return '—';
  if (start === end) return format(from, DATE_FORMAT, { locale: tr });
  if (from.getFullYear() !== to.getFullYear()) {
    return `${format(from, DATE_FORMAT, { locale: tr })} – ${format(to, DATE_FORMAT, { locale: tr })}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${format(from, 'd MMM', { locale: tr })} – ${format(to, DATE_FORMAT, { locale: tr })}`;
  }
  return `${format(from, 'd', { locale: tr })}–${format(to, DATE_FORMAT, { locale: tr })}`;
}

/** Short weekday (`Pt`, `Sa`, …) and month headings (`Eylül 2026`) for calendars. */
export function formatWeekdayShort(value: string): string {
  const date = parse(value);
  return date ? format(date, 'EEEEEE', { locale: tr }) : '';
}

export function formatMonthYear(value: string): string {
  const date = parse(value);
  return date ? format(date, 'LLLL yyyy', { locale: tr }) : '';
}

/** Long form for assistive text: `1 Ekim 2026 Perşembe`. */
export function formatDateLong(value: string): string {
  const date = parse(value);
  return date ? format(date, 'd MMMM yyyy EEEE', { locale: tr }) : '';
}

/** Chart axis month: `Eki` (with the year, `Eki 26`, when asked). */
export function formatMonthShort(value: string, withYear = false): string {
  const date = parse(value);
  return date ? format(date, withYear ? 'LLL yy' : 'LLL', { locale: tr }) : '';
}
