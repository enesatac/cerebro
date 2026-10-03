import type { EntityId } from '@/domains/shared/types';
import { includesFolded } from '@/lib/search';
import { parseId } from '@/lib/urlParams';
import type { Demand } from '../types';

/** List filters kept in the URL (`q`, `status`, `bu`, `type`) so a filtered view can be shared. */
export interface DemandFilters {
  search: string;
  status: string | null;
  businessUnitId: EntityId | null;
  type: string | null;
}

export function parseDemandFilters(params: URLSearchParams): DemandFilters {
  return {
    search: params.get('q') ?? '',
    status: params.get('status') || null,
    businessUnitId: parseId(params.get('bu')),
    type: params.get('type') || null,
  };
}

/** The current params with `patch` applied; other params (the tab) are kept. */
export function withDemandFilters(
  params: URLSearchParams,
  patch: Partial<DemandFilters>,
): URLSearchParams {
  const next = { ...parseDemandFilters(params), ...patch };
  const result = new URLSearchParams(params);
  const set = (key: string, value: string | number | null) =>
    value === null || value === '' ? result.delete(key) : result.set(key, String(value));
  set('q', next.search.trim());
  set('status', next.status);
  set('bu', next.businessUnitId);
  set('type', next.type);
  return result;
}

export const countDemandFilters = (filters: DemandFilters) =>
  [filters.search.trim(), filters.status, filters.businessUnitId, filters.type].filter(
    (value) => value !== null && value !== '',
  ).length;

/** `personName` resolves requester names so people can search by who asked. */
export function filterDemands(
  demands: readonly Demand[],
  filters: DemandFilters,
  personName: (id: EntityId) => string | undefined,
): Demand[] {
  const term = filters.search.trim();
  return demands.filter(
    (demand) =>
      (!filters.status || demand.status === filters.status) &&
      (filters.businessUnitId === null || demand.businessUnitId === filters.businessUnitId) &&
      (!filters.type || demand.type === filters.type) &&
      (!term ||
        [demand.code, demand.title, demand.problem, personName(demand.requesterId) ?? ''].some(
          (text) => includesFolded(text, term),
        )),
  );
}
