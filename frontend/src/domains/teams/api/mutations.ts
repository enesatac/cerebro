import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { TeamInput } from '../types';

export function useSaveTeam(id?: EntityId) {
  const { teams } = useRepositories();
  return useRepositoryMutation(
    (input: TeamInput) => (id ? teams.update(id, input) : teams.create(input)),
    {
      successTitle: (team) => (id ? `${team.name} güncellendi` : `${team.name} oluşturuldu`),
    },
  );
}

export function useDeleteTeam() {
  const { teams } = useRepositories();
  return useRepositoryMutation((id: EntityId) => teams.remove(id), {
    successTitle: () => 'Ekip silindi',
  });
}
