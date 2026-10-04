import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { AllocationInput } from '../types';

export function useSaveAllocation(id?: EntityId) {
  const { allocations } = useRepositories();
  return useRepositoryMutation(
    (input: AllocationInput) => (id ? allocations.update(id, input) : allocations.create(input)),
    { successTitle: () => (id ? 'Atama güncellendi' : 'Atama eklendi') },
  );
}

export function useDeleteAllocation() {
  const { allocations } = useRepositories();
  return useRepositoryMutation((id: EntityId) => allocations.remove(id), {
    successTitle: () => 'Atama silindi',
  });
}
