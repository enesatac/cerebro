import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { RiskInput } from '../types';

export function useSaveRisk(id?: string) {
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
  return useRepositoryMutation((id: string) => risks.remove(id), {
    successTitle: () => 'Risk silindi',
  });
}
