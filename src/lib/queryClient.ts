import { QueryClient } from '@tanstack/react-query';
import { isNotFoundError } from './errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // A missing entity will not appear on retry; everything else gets two retries.
        retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 2,
      },
    },
  });
}
