import type { EntityId, IsoDate } from '@/domains/shared/types';
import { CALENDAR_RANGES, type CalendarRange } from '@/domains/leaves/utils/leaveCalendar';
import { oneOf, parseId } from '@/lib/urlParams';
import { ROW_MODES, type RowMode } from './releaseCalendar';

/** Calendar state kept in the URL so a view (period, rows, filters) can be shared as a link. */
export interface ReleaseViewState {
  range: CalendarRange;
  /** Any day inside the visible period; defaults to today. */
  anchor: IsoDate;
  rows: RowMode;
  search: string;
  applicationId: EntityId | null;
  projectId: EntityId | null;
  status: string | null;
  type: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseReleaseParams(params: URLSearchParams, today: IsoDate): ReleaseViewState {
  const date = params.get('date');
  return {
    range: oneOf(CALENDAR_RANGES, params.get('range')) ?? '1m',
    anchor: date && ISO_DATE.test(date) ? date : today,
    rows: oneOf(ROW_MODES, params.get('rows')) ?? 'application',
    search: params.get('q')?.trim() ?? '',
    applicationId: parseId(params.get('application')),
    projectId: parseId(params.get('project')),
    status: params.get('status') || null,
    type: params.get('type') || null,
  };
}

export function serializeReleaseParams(
  state: ReleaseViewState,
  today: IsoDate,
  view: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (view) params.set('tab', view);
  if (state.range !== '1m') params.set('range', state.range);
  if (state.anchor !== today) params.set('date', state.anchor);
  if (state.rows !== 'application') params.set('rows', state.rows);
  if (state.search) params.set('q', state.search);
  if (state.applicationId !== null) params.set('application', String(state.applicationId));
  if (state.projectId !== null) params.set('project', String(state.projectId));
  if (state.status) params.set('status', state.status);
  if (state.type) params.set('type', state.type);
  return params;
}

export const countReleaseFilters = (state: ReleaseViewState) =>
  [state.search, state.applicationId, state.projectId, state.status, state.type].filter(
    (value) => value !== '' && value !== null,
  ).length;
