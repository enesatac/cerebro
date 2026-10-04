import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { LeaveInput } from '../types';

export function useSaveLeave(id?: EntityId) {
  const { leaves } = useRepositories();
  return useRepositoryMutation(
    (input: LeaveInput) => (id ? leaves.update(id, input) : leaves.create(input)),
    { successTitle: () => (id ? 'İzin güncellendi' : 'İzin eklendi') },
  );
}

export function useDeleteLeave() {
  const { leaves } = useRepositories();
  return useRepositoryMutation((id: EntityId) => leaves.remove(id), {
    successTitle: () => 'İzin silindi',
  });
}
