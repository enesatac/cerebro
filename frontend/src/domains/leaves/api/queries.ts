import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { LeaveQuery } from '../types';

export const leaveKeys = {
  all: ['leaves'] as const,
  list: (query: LeaveQuery) => [...leaveKeys.all, 'list', query] as const,
};

/** Leaves in a period; the previous period stays visible while the next one loads. */
export function useLeaves(query: LeaveQuery) {
  const { leaves } = useRepositories();
  return useQuery({
    queryKey: leaveKeys.list(query),
    queryFn: () => leaves.list(query),
    placeholderData: keepPreviousData,
  });
}
