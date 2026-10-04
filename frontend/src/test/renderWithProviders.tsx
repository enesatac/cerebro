import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers/AppProviders';
import { routes } from '@/app/router/routes';
import { createMockRepositories } from '@/services/mock';
import { USER } from '@/services/mock/data/ids';
import type { Repositories } from '@/services/repositories';

/** Renders the real route tree at `path` with in-memory repositories and a fresh query client. */
/** Seed accounts used by tests: an admin (Can Öztürk) unless a test passes another. */
export const TEST_ADMIN = USER.canOzturk;
export const TEST_VIEWER = USER.elifKaya;

export function renderRoute(
  path: string,
  repositories: Repositories = createMockRepositories({ signedInAs: TEST_ADMIN }),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <AppProviders queryClient={queryClient} repositories={repositories}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...utils, router, repositories };
}
