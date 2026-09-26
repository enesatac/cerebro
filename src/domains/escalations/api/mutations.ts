import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { EscalationInput } from '../types';

export function useSaveEscalation(id?: string) {
  const { escalations } = useRepositories();
  return useRepositoryMutation(
    (input: EscalationInput) => (id ? escalations.update(id, input) : escalations.create(input)),
    { successTitle: () => (id ? 'Eskalasyon güncellendi' : 'Eskalasyon açıldı') },
  );
}

export function useDeleteEscalation() {
  const { escalations } = useRepositories();
  return useRepositoryMutation((id: string) => escalations.remove(id), {
    successTitle: () => 'Eskalasyon silindi',
  });
}
