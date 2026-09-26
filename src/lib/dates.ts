import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  isValid,
  parseISO,
} from 'date-fns';

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
  return date ? format(date, DATE_FORMAT) : fallback;
}

/** `14 Mar 2026, 09:30` in the viewer's local time zone. */
export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  const date = parse(value);
  return date ? format(date, DATE_TIME_FORMAT) : fallback;
}

/** `3 days ago` / `in 2 months`, relative to `now`. */
export function formatRelative(
  value: string | null | undefined,
  now: Date = new Date(),
  fallback = '—',
): string {
  const date = parse(value);
  return date ? formatDistanceStrict(date, now, { addSuffix: true }) : fallback;
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
