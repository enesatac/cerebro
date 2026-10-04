import { oneOf } from '@/lib/urlParams';
import {
  TECHNOLOGY_STATUSES,
  type TechnologyCategory,
  type TechnologyListItem,
  type TechnologyStatus,
} from '../types';

export interface TechnologyFilterState {
  search: string;
  category: TechnologyCategory | null;
  status: TechnologyStatus | null;
}

export function parseTechnologyFilters(params: URLSearchParams): TechnologyFilterState {
  return {
    search: params.get('q')?.trim() ?? '',
    // Categories are administrable master data, so any code is accepted here.
    category: params.get('category') || null,
    status: oneOf(TECHNOLOGY_STATUSES, params.get('status')),
  };
}

export function serializeTechnologyFilters(state: TechnologyFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set('q', state.search);
  if (state.category) params.set('category', state.category);
  if (state.status) params.set('status', state.status);
  return params;
}

export function filterTechnologies(
  technologies: readonly TechnologyListItem[],
  { search, category, status }: TechnologyFilterState,
): TechnologyListItem[] {
  const needle = search.toLowerCase();
  return technologies.filter(
    (tech) =>
      (!needle ||
        tech.name.toLowerCase().includes(needle) ||
        tech.description.toLowerCase().includes(needle)) &&
      (!category || tech.category === category) &&
      (!status || tech.status === status),
  );
}
