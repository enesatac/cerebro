import { useQuery } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';

export const procurementKeys = {
  all: ['procurement'] as const,
  list: () => [...procurementKeys.all, 'list'] as const,
  detail: (contractId: EntityId) => [...procurementKeys.all, 'detail', contractId] as const,
};

export function useProcurementList() {
  const { procurement } = useRepositories();
  return useQuery({ queryKey: procurementKeys.list(), queryFn: () => procurement.list() });
}

export function useProcurement(contractId: EntityId) {
  const { procurement } = useRepositories();
  return useQuery({
    queryKey: procurementKeys.detail(contractId),
    queryFn: () => procurement.getById(contractId),
  });
}
