import { useQuery } from '@tanstack/react-query';
import type { ApplicationId } from '@/domains/applications/types';
import { useRepositories } from '@/services/RepositoryContext';

export const runbookKeys = {
  all: ['runbooks'] as const,
  byApplication: (id: ApplicationId) => [...runbookKeys.all, 'application', id] as const,
};

export function useRunbook(applicationId: ApplicationId) {
  const { runbooks } = useRepositories();
  return useQuery({
    queryKey: runbookKeys.byApplication(applicationId),
    queryFn: () => runbooks.getByApplication(applicationId),
  });
}
