import { useQuery } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { RelatedEntityFilter } from '../types';

export const riskKeys = {
  all: ['risks'] as const,
  list: (filter: RelatedEntityFilter) => [...riskKeys.all, 'list', filter] as const,
};

export function useRisks(filter: RelatedEntityFilter) {
  const { risks } = useRepositories();
  return useQuery({ queryKey: riskKeys.list(filter), queryFn: () => risks.list(filter) });
}

export function useRisk(id: EntityId) {
  const { risks } = useRepositories();
  return useQuery({ queryKey: [...riskKeys.all, 'detail', id], queryFn: () => risks.getById(id) });
}
