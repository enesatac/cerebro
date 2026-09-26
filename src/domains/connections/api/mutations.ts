import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { DependencyInput, IntegrationInput } from '../types';

export function useSaveDependency(id?: string) {
  const { connections } = useRepositories();
  return useRepositoryMutation(
    (input: DependencyInput) =>
      id ? connections.dependencies.update(id, input) : connections.dependencies.create(input),
    { successTitle: () => (id ? 'Bağımlılık güncellendi' : 'Bağımlılık kaydedildi') },
  );
}

export function useDeleteDependency() {
  const { connections } = useRepositories();
  return useRepositoryMutation((id: string) => connections.dependencies.remove(id), {
    successTitle: () => 'Bağımlılık silindi',
  });
}

export function useSaveIntegration(id?: string) {
  const { connections } = useRepositories();
  return useRepositoryMutation(
    (input: IntegrationInput) =>
      id ? connections.integrations.update(id, input) : connections.integrations.create(input),
    {
      successTitle: (integration) =>
        id ? `${integration.name} güncellendi` : `${integration.name} kaydedildi`,
    },
  );
}

export function useDeleteIntegration() {
  const { connections } = useRepositories();
  return useRepositoryMutation((id: string) => connections.integrations.remove(id), {
    successTitle: () => 'Entegrasyon silindi',
  });
}
