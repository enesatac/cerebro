import { useQuery } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import type { ApplicationId } from '@/domains/applications/types';
import { useRepositories } from '@/services/RepositoryContext';

export const connectionKeys = {
  all: ['connections'] as const,
  dependencies: (applicationId: ApplicationId) =>
    [...connectionKeys.all, 'dependencies', applicationId] as const,
  integrations: (applicationId: ApplicationId) =>
    [...connectionKeys.all, 'integrations', applicationId] as const,
};

export function useApplicationDependencies(applicationId: ApplicationId) {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: connectionKeys.dependencies(applicationId),
    queryFn: () => connections.getApplicationDependencies(applicationId),
  });
}

export function useApplicationIntegrations(applicationId: ApplicationId) {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: connectionKeys.integrations(applicationId),
    queryFn: () => connections.getApplicationIntegrations(applicationId),
  });
}

export function useAllDependencies() {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: [...connectionKeys.all, 'dependencies', 'all'],
    queryFn: () => connections.listDependencies(),
  });
}

export function useAllIntegrations() {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: [...connectionKeys.all, 'integrations', 'all'],
    queryFn: () => connections.listIntegrations(),
  });
}

export function useDependency(id: EntityId) {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: [...connectionKeys.all, 'dependency', id],
    queryFn: () => connections.dependencies.getById(id),
  });
}

export function useIntegration(id: EntityId) {
  const { connections } = useRepositories();
  return useQuery({
    queryKey: [...connectionKeys.all, 'integration', id],
    queryFn: () => connections.integrations.getById(id),
  });
}
