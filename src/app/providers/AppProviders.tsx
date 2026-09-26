import { TakeoffSparProvider, Toaster } from '@takeoff-ui/react-spar';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toaster } from '@/lib/toaster';
import { RepositoryProvider } from '@/services/RepositoryContext';
import type { Repositories } from '@/services/repositories';

interface AppProvidersProps {
  queryClient: QueryClient;
  repositories: Repositories;
  children: ReactNode;
}

/** Everything the UI needs from its environment. Tests use the same providers with test doubles. */
export function AppProviders({ queryClient, repositories, children }: AppProvidersProps) {
  return (
    <TakeoffSparProvider
      colorMode="light"
      locale="en"
      // App-wide density: Cerebro is an information-dense tool used daily.
      components={{ Table: { defaultProps: { size: 'small' } } }}
    >
      <QueryClientProvider client={queryClient}>
        <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>
        <Toaster toaster={toaster} appearance="outlined" />
      </QueryClientProvider>
    </TakeoffSparProvider>
  );
}
