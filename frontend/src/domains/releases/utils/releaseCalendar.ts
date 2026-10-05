import { addDays, parseISO } from 'date-fns';
import type { EntityId, IsoDate } from '@/domains/shared/types';
import { toIsoDate } from '@/lib/dates';
import { FINISHED_RELEASE_STATUSES, type Release } from '../types';

/** Rows of the release calendar: one per application or one per project. */
export const ROW_MODES = ['application', 'project'] as const;
export type RowMode = (typeof ROW_MODES)[number];

/** Still to happen (or running): not finished and not cancelled. */
export const isOpenRelease = (release: Pick<Release, 'status'>) =>
  !FINISHED_RELEASE_STATUSES.includes(release.status) && release.status !== 'cancelled';

/** Its day has passed but nobody recorded how it went. */
export const awaitsOutcome = (release: Release, today: IsoDate) =>
  isOpenRelease(release) && release.plannedDate < today;

/** The window ends after midnight (`23:00 – 02:00`). */
export const isOvernight = (release: Pick<Release, 'startTime' | 'endTime'>) =>
  release.startTime !== '' && release.endTime !== '' && release.endTime < release.startTime;

/** `23:00 – 02:00 (+1 gün)`, `14:00`, or `Saat belirtilmedi`. */
export function releaseWindow(release: Pick<Release, 'startTime' | 'endTime'>): string {
  if (!release.startTime) return 'Saat belirtilmedi';
  if (!release.endTime) return release.startTime;
  return `${release.startTime} – ${release.endTime}${isOvernight(release) ? ' (+1 gün)' : ''}`;
}

export interface CalendarRow {
  /** `application-3`, `project-2`, `project-none`. */
  key: string;
  id: EntityId | null;
  name: string;
  /** Releases of the row by day. */
  byDay: Map<IsoDate, Release[]>;
  count: number;
}

/**
 * Calendar rows: every application (or project) with a release in the list, by name; releases
 * without a project form a last "Projesiz" row in project mode.
 */
export function calendarRows(
  releases: readonly Release[],
  mode: RowMode,
  nameOf: (id: EntityId) => string,
): CalendarRow[] {
  const rows = new Map<string, CalendarRow>();
  for (const release of releases) {
    const id = mode === 'application' ? release.applicationId : release.projectId;
    const key = `${mode}-${id ?? 'none'}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        id,
        name: id === null ? 'Projesiz geçişler' : nameOf(id),
        byDay: new Map(),
        count: 0,
      };
      rows.set(key, row);
    }
    row.byDay.set(release.plannedDate, [...(row.byDay.get(release.plannedDate) ?? []), release]);
    row.count += 1;
  }
  return [...rows.values()].sort(
    (a, b) => Number(a.id === null) - Number(b.id === null) || a.name.localeCompare(b.name, 'tr'),
  );
}

/** Headline figures of the calendar for the visible releases. */
export function releaseMetrics(releases: readonly Release[], today: IsoDate) {
  const weekEnd = toIsoDate(addDays(parseISO(today), 6));
  const open = releases.filter(isOpenRelease);
  return {
    nextSevenDays: open.filter((r) => r.plannedDate >= today && r.plannedDate <= weekEnd).length,
    upcoming: open.filter((r) => r.plannedDate >= today).length,
    withInterruption: open.filter((r) => r.plannedDate >= today && r.serviceInterruption).length,
    completed: releases.filter((r) => r.status === 'completed').length,
    rolledBack: releases.filter((r) => r.status === 'rolled-back').length,
    awaitingOutcome: releases.filter((r) => awaitsOutcome(r, today)).length,
  };
}
