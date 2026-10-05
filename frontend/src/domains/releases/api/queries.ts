import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { ReleaseId, ReleaseQuery } from '../types';

export const releaseKeys = {
  all: ['releases'] as const,
  list: (query: ReleaseQuery) => [...releaseKeys.all, 'list', query] as const,
  detail: (id: ReleaseId) => [...releaseKeys.all, 'detail', id] as const,
};

export function useReleases(query: ReleaseQuery = {}) {
  const { releases } = useRepositories();
  return useQuery({ queryKey: releaseKeys.list(query), queryFn: () => releases.list(query) });
}

export function useRelease(id: ReleaseId) {
  const { releases } = useRepositories();
  return useQuery({ queryKey: releaseKeys.detail(id), queryFn: () => releases.getById(id) });
}
