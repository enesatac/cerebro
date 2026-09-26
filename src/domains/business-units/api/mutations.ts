import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { BusinessUnitInput } from '../types';

export function useSaveBusinessUnit(id?: string) {
  const { businessUnits } = useRepositories();
  return useRepositoryMutation(
    (input: BusinessUnitInput) =>
      id ? businessUnits.update(id, input) : businessUnits.create(input),
    { successTitle: (unit) => (id ? `${unit.name} güncellendi` : `${unit.name} eklendi`) },
  );
}

export function useDeleteBusinessUnit() {
  const { businessUnits } = useRepositories();
  return useRepositoryMutation((id: string) => businessUnits.remove(id), {
    successTitle: () => 'İş birimi silindi',
  });
}
