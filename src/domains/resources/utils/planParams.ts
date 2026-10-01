import type { EntityId, IsoDate } from '@/domains/shared/types';
import { oneOf, parseId } from '@/lib/urlParams';
import { PLAN_RANGES, type PlanRange } from './resourcePlan';

/** Planner state kept in the URL so a view (period + filters) can be shared as a link. */
export interface PlanViewState {
  range: PlanRange;
  /** Any day inside the first visible month; defaults to today. */
  anchor: IsoDate;
  search: string;
  businessUnitId: EntityId | null;
  teamId: EntityId | null;
  projectId: EntityId | null;
  /** Only people over 100 % at some point in the period. */
  overOnly: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_RANGE: PlanRange = '6m';

export function parsePlanParams(params: URLSearchParams, today: IsoDate): PlanViewState {
  const date = params.get('date');
  return {
    range: oneOf(PLAN_RANGES, params.get('range')) ?? DEFAULT_RANGE,
    anchor: date && ISO_DATE.test(date) ? date : today,
    search: params.get('q')?.trim() ?? '',
    businessUnitId: parseId(params.get('bu')),
    teamId: parseId(params.get('team')),
    projectId: parseId(params.get('project')),
    overOnly: params.get('over') === '1',
  };
}

export function serializePlanParams(
  state: PlanViewState,
  today: IsoDate,
  view: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (view) params.set('tab', view);
  if (state.range !== DEFAULT_RANGE) params.set('range', state.range);
  if (state.anchor !== today) params.set('date', state.anchor);
  if (state.search) params.set('q', state.search);
  if (state.businessUnitId !== null) params.set('bu', String(state.businessUnitId));
  if (state.teamId !== null) params.set('team', String(state.teamId));
  if (state.projectId !== null) params.set('project', String(state.projectId));
  if (state.overOnly) params.set('over', '1');
  return params;
}

export const countPlanFilters = (state: PlanViewState) =>
  [state.search, state.businessUnitId, state.teamId, state.projectId, state.overOnly].filter(
    (value) => value !== '' && value !== null && value !== false,
  ).length;
