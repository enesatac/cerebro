import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { PersonInput } from '../types';

export function useSavePerson(id?: EntityId) {
  const { people } = useRepositories();
  return useRepositoryMutation(
    (input: PersonInput) => (id ? people.update(id, input) : people.create(input)),
    {
      successTitle: (person) =>
        id ? `${person.fullName} güncellendi` : `${person.fullName} eklendi`,
    },
  );
}

export function useDeletePerson() {
  const { people } = useRepositories();
  return useRepositoryMutation((id: EntityId) => people.remove(id), {
    successTitle: () => 'Kişi silindi',
  });
}
