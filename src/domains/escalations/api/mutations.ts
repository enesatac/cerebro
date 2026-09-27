import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { EscalationInput } from '../types';

export function useSaveEscalation(id?: EntityId) {
  const { escalations } = useRepositories();
  return useRepositoryMutation(
    (input: EscalationInput) => (id ? escalations.update(id, input) : escalations.create(input)),
    { successTitle: () => (id ? 'Eskalasyon güncellendi' : 'Eskalasyon açıldı') },
  );
}

export function useDeleteEscalation() {
  const { escalations } = useRepositories();
  return useRepositoryMutation((id: EntityId) => escalations.remove(id), {
    successTitle: () => 'Eskalasyon silindi',
  });
}
