import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { ApplicationInput } from '../types';

export function useSaveApplication(id?: string) {
  const { applications } = useRepositories();
  return useRepositoryMutation(
    (input: ApplicationInput) => (id ? applications.update(id, input) : applications.create(input)),
    { successTitle: (app) => (id ? `${app.name} güncellendi` : `${app.name} kaydedildi`) },
  );
}

export function useDeleteApplication() {
  const { applications } = useRepositories();
  return useRepositoryMutation((id: string) => applications.remove(id), {
    successTitle: () => 'Uygulama silindi',
  });
}
