import { CRITICALITIES, type Criticality, type SortSpec } from '@/domains/shared/types';
import {
  APPLICATION_LIFECYCLES,
  APPLICATION_SORT_FIELDS,
  type ApplicationLifecycle,
  type ApplicationListQuery,
  type ApplicationSortField,
} from '../types';
import { oneOf, parsePageIndex, parsePageSize } from '@/lib/urlParams';

export const APPLICATION_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_APPLICATION_PAGE_SIZE = 25;
export const DEFAULT_APPLICATION_SORT: SortSpec<ApplicationSortField> = {
  field: 'name',
  direction: 'asc',
};

/** Everything about the Applications list that lives in the URL (shareable, back-button safe). */
export interface ApplicationListState {
  search: string;
  lifecycle: ApplicationLifecycle | null;
  criticality: Criticality | null;
  teamId: string | null;
  technologyId: string | null;
  businessUnitId: string | null;
  sort: SortSpec<ApplicationSortField>;
  /** Zero-based. */
  page: number;
  pageSize: number;
}

export const DEFAULT_APPLICATION_LIST_STATE: ApplicationListState = {
  search: '',
  lifecycle: null,
  criticality: null,
  teamId: null,
  technologyId: null,
  businessUnitId: null,
  sort: DEFAULT_APPLICATION_SORT,
  page: 0,
  pageSize: DEFAULT_APPLICATION_PAGE_SIZE,
};

/** Parses URL params, silently discarding anything invalid (URLs are user input). */
export function parseApplicationListParams(params: URLSearchParams): ApplicationListState {
  const sortField = oneOf(APPLICATION_SORT_FIELDS, params.get('sort'));
  const direction = params.get('dir') === 'desc' ? 'desc' : 'asc';
  return {
    search: params.get('q')?.trim() ?? '',
    lifecycle: oneOf(APPLICATION_LIFECYCLES, params.get('lifecycle')),
    criticality: oneOf(CRITICALITIES, params.get('criticality')),
    teamId: params.get('team') || null,
    technologyId: params.get('technology') || null,
    businessUnitId: params.get('bu') || null,
    sort: sortField ? { field: sortField, direction } : DEFAULT_APPLICATION_SORT,
    // URL pages are 1-based for humans.
    page: parsePageIndex(params.get('page')),
    pageSize: parsePageSize(
      params.get('size'),
      APPLICATION_PAGE_SIZES,
      DEFAULT_APPLICATION_PAGE_SIZE,
    ),
  };
}

/** Serialises state to URL params, omitting defaults to keep links short. */
export function serializeApplicationListParams(state: ApplicationListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set('q', state.search);
  if (state.lifecycle) params.set('lifecycle', state.lifecycle);
  if (state.criticality) params.set('criticality', state.criticality);
  if (state.teamId) params.set('team', state.teamId);
  if (state.technologyId) params.set('technology', state.technologyId);
  if (state.businessUnitId) params.set('bu', state.businessUnitId);
  const isDefaultSort =
    state.sort.field === DEFAULT_APPLICATION_SORT.field &&
    state.sort.direction === DEFAULT_APPLICATION_SORT.direction;
  if (!isDefaultSort) {
    params.set('sort', state.sort.field);
    params.set('dir', state.sort.direction);
  }
  if (state.page > 0) params.set('page', String(state.page + 1));
  if (state.pageSize !== DEFAULT_APPLICATION_PAGE_SIZE) params.set('size', String(state.pageSize));
  return params;
}

export function toApplicationListQuery(state: ApplicationListState): ApplicationListQuery {
  return {
    ...(state.search && { search: state.search }),
    ...(state.lifecycle && { lifecycles: [state.lifecycle] }),
    ...(state.criticality && { criticalities: [state.criticality] }),
    ...(state.teamId && { teamId: state.teamId }),
    ...(state.technologyId && { technologyId: state.technologyId }),
    ...(state.businessUnitId && { businessUnitId: state.businessUnitId }),
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
}

export function countActiveFilters(state: ApplicationListState): number {
  return [
    state.search,
    state.lifecycle,
    state.criticality,
    state.teamId,
    state.technologyId,
    state.businessUnitId,
  ].filter(Boolean).length;
}
