import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IsoDate } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { ReportPeriod } from '../types';

export const governanceKeys = {
  all: ['governance'] as const,
  overview: () => [...governanceKeys.all, 'overview'] as const,
  applicationHealth: () => [...governanceKeys.all, 'application-health'] as const,
  trends: (period: ReportPeriod, today: IsoDate) =>
    [...governanceKeys.all, 'trends', period, today] as const,
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

/** Report charts for a period; the previous period stays on screen while the next loads. */
export function usePortfolioTrends(period: ReportPeriod, today: IsoDate) {
  const { governance } = useRepositories();
  return useQuery({
    queryKey: governanceKeys.trends(period, today),
    queryFn: () => governance.getTrends(period, today),
    placeholderData: keepPreviousData,
  });
}
