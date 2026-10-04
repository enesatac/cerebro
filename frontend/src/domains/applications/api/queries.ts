import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { ApplicationId, ApplicationListQuery } from '../types';

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (query: ApplicationListQuery) => [...applicationKeys.lists(), query] as const,
  detail: (id: ApplicationId) => [...applicationKeys.all, 'detail', id] as const,
  refs: () => [...applicationKeys.all, 'refs'] as const,
};

export function useApplicationList(query: ApplicationListQuery) {
  const { applications } = useRepositories();
  return useQuery({
    queryKey: applicationKeys.list(query),
    queryFn: () => applications.list(query),
    // Keep the current page visible while the next page/filter result loads.
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: ApplicationId) {
  const { applications } = useRepositories();
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applications.getById(id),
  });
}

/** id → `{ name, code }` for every application, for resolving relationship endpoints. */
export function useApplicationRefs() {
  const { applications } = useRepositories();
  return useQuery({
    queryKey: applicationKeys.refs(),
    queryFn: () => applications.listRefs(),
    select: (refs) => new Map(refs.map((ref) => [ref.id, ref])),
  });
}

/** Applications as Select options, "Name (CODE)", sorted by name. */
export function useApplicationOptions() {
  const refs = useApplicationRefs();
  return [...(refs.data?.values() ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ref) => ({ value: String(ref.id), label: `${ref.name} (${ref.code})` }));
}
