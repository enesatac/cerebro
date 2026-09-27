import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { RiskInput } from '../types';

export function useSaveRisk(id?: EntityId) {
  const { risks } = useRepositories();
  return useRepositoryMutation(
    (input: RiskInput) => (id ? risks.update(id, input) : risks.create(input)),
    {
      successTitle: () => (id ? 'Risk güncellendi' : 'Risk kaydedildi'),
    },
  );
}

export function useDeleteRisk() {
  const { risks } = useRepositories();
  return useRepositoryMutation((id: EntityId) => risks.remove(id), {
    successTitle: () => 'Risk silindi',
  });
}
