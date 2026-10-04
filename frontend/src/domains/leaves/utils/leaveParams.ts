import type { EntityId, IsoDate } from '@/domains/shared/types';
import { oneOf, parseId } from '@/lib/urlParams';
import { CALENDAR_RANGES, type CalendarRange } from './leaveCalendar';

/** Calendar state kept in the URL so a view (period + filters) can be shared as a link. */
export interface LeaveViewState {
  range: CalendarRange;
  /** Any day inside the visible period; defaults to today. */
  anchor: IsoDate;
  search: string;
  businessUnitId: EntityId | null;
  teamId: EntityId | null;
  type: string | null;
  /** Only people with a leave in the period. */
  awayOnly: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseLeaveParams(params: URLSearchParams, today: IsoDate): LeaveViewState {
  const date = params.get('date');
  return {
    range: oneOf(CALENDAR_RANGES, params.get('range')) ?? '1m',
    anchor: date && ISO_DATE.test(date) ? date : today,
    search: params.get('q')?.trim() ?? '',
    businessUnitId: parseId(params.get('bu')),
    teamId: parseId(params.get('team')),
    type: params.get('type') || null,
    awayOnly: params.get('away') === '1',
  };
}

export function serializeLeaveParams(
  state: LeaveViewState,
  today: IsoDate,
  view: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (view) params.set('tab', view);
  if (state.range !== '1m') params.set('range', state.range);
  if (state.anchor !== today) params.set('date', state.anchor);
  if (state.search) params.set('q', state.search);
  if (state.businessUnitId !== null) params.set('bu', String(state.businessUnitId));
  if (state.teamId !== null) params.set('team', String(state.teamId));
  if (state.type) params.set('type', state.type);
  if (state.awayOnly) params.set('away', '1');
  return params;
}

export const countLeaveFilters = (state: LeaveViewState) =>
  [state.search, state.businessUnitId, state.teamId, state.type, state.awayOnly].filter(
    (value) => value !== '' && value !== null && value !== false,
  ).length;
