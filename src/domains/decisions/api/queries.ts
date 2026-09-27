import { useQuery } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import type { RelatedEntityFilter } from '@/domains/risks/types';
import { useRepositories } from '@/services/RepositoryContext';

export const decisionKeys = {
  all: ['decisions'] as const,
  list: (filter: RelatedEntityFilter) => [...decisionKeys.all, 'list', filter] as const,
};

export function useDecisions(filter: RelatedEntityFilter) {
  const { decisions } = useRepositories();
  return useQuery({ queryKey: decisionKeys.list(filter), queryFn: () => decisions.list(filter) });
}

export function useDecision(id: EntityId) {
  const { decisions } = useRepositories();
  return useQuery({
    queryKey: [...decisionKeys.all, 'detail', id],
    queryFn: () => decisions.getById(id),
  });
}
