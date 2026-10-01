import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { AllocationQuery } from '../types';

export const allocationKeys = {
  all: ['allocations'] as const,
  list: (query: AllocationQuery) => [...allocationKeys.all, 'list', query] as const,
};

/** Allocations in a period; the previous period stays visible while the next one loads. */
export function useAllocations(query: AllocationQuery, enabled = true) {
  const { allocations } = useRepositories();
  return useQuery({
    queryKey: allocationKeys.list(query),
    queryFn: () => allocations.list(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}
