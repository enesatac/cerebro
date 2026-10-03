import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppError, isNotFoundError } from './errors';

const isUnauthenticated = (error: unknown) =>
  error instanceof AppError && error.code === 'unauthenticated';

/**
 * `onUnauthenticated` runs when the server says the session is gone (expired, signed out
 * elsewhere), so the app can send the user back to sign in instead of showing errors.
 */
export function createQueryClient(onUnauthenticated?: (client: QueryClient) => void): QueryClient {
  const notify = (error: unknown) => {
    if (isUnauthenticated(error)) onUnauthenticated?.(client);
  };
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: notify }),
    mutationCache: new MutationCache({ onError: notify }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // A missing entity will not appear on retry; everything else gets two retries.
        retry: (failureCount, error) =>
          !isNotFoundError(error) && !isUnauthenticated(error) && failureCount < 2,
      },
    },
  });
  return client;
}
