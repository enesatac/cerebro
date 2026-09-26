import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { createQueryClient } from '@/lib/queryClient';
import { createRepositories } from '@/services/repositories';
import { AppProviders } from './providers/AppProviders';
import { createAppRouter } from './router/routes';

export function App() {
  // Created once per app instance (not per render).
  const [queryClient] = useState(createQueryClient);
  const [repositories] = useState(createRepositories);
  const [router] = useState(createAppRouter);

  return (
    <AppProviders queryClient={queryClient} repositories={repositories}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
