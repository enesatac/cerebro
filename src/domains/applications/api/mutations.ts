import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import type { EntityId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { ApplicationInput } from '../types';

export function useSaveApplication(id?: EntityId) {
  const { applications } = useRepositories();
  return useRepositoryMutation(
    (input: ApplicationInput) => (id ? applications.update(id, input) : applications.create(input)),
    { successTitle: (app) => (id ? `${app.name} güncellendi` : `${app.name} kaydedildi`) },
  );
}

export function useDeleteApplication() {
  const { applications } = useRepositories();
  return useRepositoryMutation((id: EntityId) => applications.remove(id), {
    successTitle: () => 'Uygulama silindi',
  });
}
