import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { DecisionInput } from '../types';

export function useSaveDecision(id?: EntityId) {
  const { decisions } = useRepositories();
  return useRepositoryMutation(
    (input: DecisionInput) => (id ? decisions.update(id, input) : decisions.create(input)),
    { successTitle: () => (id ? 'Karar güncellendi' : 'Karar kaydedildi') },
  );
}

export function useDeleteDecision() {
  const { decisions } = useRepositories();
  return useRepositoryMutation((id: EntityId) => decisions.remove(id), {
    successTitle: () => 'Karar silindi',
  });
}
