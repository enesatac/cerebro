import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { DecisionInput } from '../types';

export function useSaveDecision(id?: string) {
  const { decisions } = useRepositories();
  return useRepositoryMutation(
    (input: DecisionInput) => (id ? decisions.update(id, input) : decisions.create(input)),
    { successTitle: () => (id ? 'Decision updated' : 'Decision recorded') },
  );
}

export function useDeleteDecision() {
  const { decisions } = useRepositories();
  return useRepositoryMutation((id: string) => decisions.remove(id), {
    successTitle: () => 'Decision deleted',
  });
}
