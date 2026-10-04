import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { MasterDataListKey } from '../types';

export const masterDataKeys = {
  all: ['master-data'] as const,
  usage: (key: MasterDataListKey) => ['master-data', 'usage', key] as const,
};

/** All value lists. Loaded once per session by `MasterDataProvider`; refetched after edits. */
export function useMasterDataLists() {
  const { masterData } = useRepositories();
  return useQuery({
    queryKey: masterDataKeys.all,
    queryFn: () => masterData.listAll(),
    staleTime: 10 * 60_000,
  });
}

export function useMasterDataUsage(key: MasterDataListKey) {
  const { masterData } = useRepositories();
  return useQuery({
    queryKey: masterDataKeys.usage(key),
    queryFn: () => masterData.getUsage(key),
  });
}
