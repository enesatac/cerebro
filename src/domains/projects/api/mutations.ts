import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { ProjectInput } from '../types';

export function useSaveProject(id?: string) {
  const { projects } = useRepositories();
  return useRepositoryMutation(
    (input: ProjectInput) => (id ? projects.update(id, input) : projects.create(input)),
    {
      successTitle: (project) =>
        id ? `${project.name} güncellendi` : `${project.name} oluşturuldu`,
    },
  );
}

export function useDeleteProject() {
  const { projects } = useRepositories();
  return useRepositoryMutation((id: string) => projects.remove(id), {
    successTitle: () => 'Proje silindi',
  });
}
