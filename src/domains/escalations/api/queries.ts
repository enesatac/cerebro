import { useQuery } from '@tanstack/react-query';
import type { RelatedEntityFilter } from '@/domains/risks/types';
import { useRepositories } from '@/services/RepositoryContext';

export const escalationKeys = {
  all: ['escalations'] as const,
  list: (filter: RelatedEntityFilter) => [...escalationKeys.all, 'list', filter] as const,
};

export function useEscalations(filter: RelatedEntityFilter) {
  const { escalations } = useRepositories();
  return useQuery({
    queryKey: escalationKeys.list(filter),
    queryFn: () => escalations.list(filter),
  });
}

export function useEscalation(id: string) {
  const { escalations } = useRepositories();
  return useQuery({
    queryKey: [...escalationKeys.all, 'detail', id],
    queryFn: () => escalations.getById(id),
  });
}
