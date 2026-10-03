import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { DemandId } from '../types';

export const demandKeys = {
  all: ['demands'] as const,
  list: () => [...demandKeys.all, 'list'] as const,
  detail: (id: DemandId) => [...demandKeys.all, 'detail', id] as const,
};

/** Every demand; a few hundred at most, so filtering and ranking happen in the browser. */
export function useDemands() {
  const { demands } = useRepositories();
  return useQuery({ queryKey: demandKeys.list(), queryFn: () => demands.list() });
}

export function useDemand(id: DemandId) {
  const { demands } = useRepositories();
  return useQuery({ queryKey: demandKeys.detail(id), queryFn: () => demands.getById(id) });
}
