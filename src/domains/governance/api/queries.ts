import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';

export const governanceKeys = {
  all: ['governance'] as const,
  overview: () => [...governanceKeys.all, 'overview'] as const,
  applicationHealth: () => [...governanceKeys.all, 'application-health'] as const,
};

export function usePortfolioOverview() {
  const { governance } = useRepositories();
  return useQuery({
    queryKey: governanceKeys.overview(),
    queryFn: () => governance.getPortfolioOverview(),
  });
}

export function useApplicationHealthReport() {
  const { governance } = useRepositories();
  return useQuery({
    queryKey: governanceKeys.applicationHealth(),
    queryFn: () => governance.getApplicationHealthReport(),
  });
}
