import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { TechnologyInput } from '../types';

export function useSaveTechnology(id?: EntityId) {
  const { technologies } = useRepositories();
  return useRepositoryMutation(
    (input: TechnologyInput) => (id ? technologies.update(id, input) : technologies.create(input)),
    {
      successTitle: (tech) => (id ? `${tech.name} güncellendi` : `${tech.name} kataloğa eklendi`),
    },
  );
}

export function useDeleteTechnology() {
  const { technologies } = useRepositories();
  return useRepositoryMutation((id: EntityId) => technologies.remove(id), {
    successTitle: () => 'Teknoloji silindi',
  });
}
