import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { authKeys } from '@/domains/auth/api/queries';
import { createQueryClient } from '@/lib/queryClient';
import { createRepositories } from '@/services/repositories';
import { AppProviders } from './providers/AppProviders';
import { createAppRouter } from './router/routes';

export function App() {
  // Created once per app instance (not per render).
  // A lost session (expired on the server) signs the user out: the route guard sends them to sign in.
  const [queryClient] = useState(() =>
    createQueryClient((client) => client.setQueryData(authKeys.session, null)),
  );
  const [repositories] = useState(createRepositories);
  const [router] = useState(createAppRouter);

  return (
    <AppProviders queryClient={queryClient} repositories={repositories}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
