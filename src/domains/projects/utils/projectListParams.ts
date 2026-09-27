import type { SortSpec, EntityId } from '@/domains/shared/types';
import { oneOf, parsePageIndex, parsePageSize, parseId } from '@/lib/urlParams';
import {
  PROJECT_HEALTHS,
  PROJECT_SORT_FIELDS,
  PROJECT_STATUSES,
  type ProjectHealth,
  type ProjectListQuery,
  type ProjectSortField,
  type ProjectStatus,
} from '../types';

export const PROJECT_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_PROJECT_PAGE_SIZE = 25;
export const DEFAULT_PROJECT_SORT: SortSpec<ProjectSortField> = { field: 'name', direction: 'asc' };

export interface ProjectListState {
  search: string;
  status: ProjectStatus | null;
  health: ProjectHealth | null;
  businessUnitId: EntityId | null;
  teamId: EntityId | null;
  sort: SortSpec<ProjectSortField>;
  page: number;
  pageSize: number;
}

export const DEFAULT_PROJECT_LIST_STATE: ProjectListState = {
  search: '',
  status: null,
  health: null,
  businessUnitId: null,
  teamId: null,
  sort: DEFAULT_PROJECT_SORT,
  page: 0,
  pageSize: DEFAULT_PROJECT_PAGE_SIZE,
};

export function parseProjectListParams(params: URLSearchParams): ProjectListState {
  const sortField = oneOf(PROJECT_SORT_FIELDS, params.get('sort'));
  return {
    search: params.get('q')?.trim() ?? '',
    status: oneOf(PROJECT_STATUSES, params.get('status')),
    health: oneOf(PROJECT_HEALTHS, params.get('health')),
    businessUnitId: parseId(params.get('bu')),
    teamId: parseId(params.get('team')),
    sort: sortField
      ? { field: sortField, direction: params.get('dir') === 'desc' ? 'desc' : 'asc' }
      : DEFAULT_PROJECT_SORT,
    page: parsePageIndex(params.get('page')),
    pageSize: parsePageSize(params.get('size'), PROJECT_PAGE_SIZES, DEFAULT_PROJECT_PAGE_SIZE),
  };
}

export function serializeProjectListParams(state: ProjectListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set('q', state.search);
  if (state.status) params.set('status', state.status);
  if (state.health) params.set('health', state.health);
  if (state.businessUnitId !== null) params.set('bu', String(state.businessUnitId));
  if (state.teamId !== null) params.set('team', String(state.teamId));
  if (
    state.sort.field !== DEFAULT_PROJECT_SORT.field ||
    state.sort.direction !== DEFAULT_PROJECT_SORT.direction
  ) {
    params.set('sort', state.sort.field);
    params.set('dir', state.sort.direction);
  }
  if (state.page > 0) params.set('page', String(state.page + 1));
  if (state.pageSize !== DEFAULT_PROJECT_PAGE_SIZE) params.set('size', String(state.pageSize));
  return params;
}

export function toProjectListQuery(state: ProjectListState): ProjectListQuery {
  return {
    ...(state.search && { search: state.search }),
    ...(state.status && { statuses: [state.status] }),
    ...(state.health && { healths: [state.health] }),
    ...(state.businessUnitId && { businessUnitId: state.businessUnitId }),
    ...(state.teamId && { teamId: state.teamId }),
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
}

export function countActiveProjectFilters(state: ProjectListState): number {
  return [state.search, state.status, state.health, state.businessUnitId, state.teamId].filter(
    Boolean,
  ).length;
}
