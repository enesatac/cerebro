import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { RunbookInput } from '../types';

export function useSaveRunbook(id?: EntityId) {
  const { runbooks } = useRepositories();
  return useRepositoryMutation(
    (input: RunbookInput) => (id ? runbooks.update(id, input) : runbooks.create(input)),
    { successTitle: () => (id ? 'Müdahale rehberi güncellendi' : 'Müdahale rehberi oluşturuldu') },
  );
}

export function useDeleteRunbook() {
  const { runbooks } = useRepositories();
  return useRepositoryMutation((id: EntityId) => runbooks.remove(id), {
    successTitle: () => 'Müdahale rehberi silindi',
  });
}
