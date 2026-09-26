import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { TechnologyInput } from '../types';

export function useSaveTechnology(id?: string) {
  const { technologies } = useRepositories();
  return useRepositoryMutation(
    (input: TechnologyInput) => (id ? technologies.update(id, input) : technologies.create(input)),
    {
      successTitle: (tech) => (id ? `${tech.name} updated` : `${tech.name} added to the catalogue`),
    },
  );
}

export function useDeleteTechnology() {
  const { technologies } = useRepositories();
  return useRepositoryMutation((id: string) => technologies.remove(id), {
    successTitle: () => 'Technology deleted',
  });
}
