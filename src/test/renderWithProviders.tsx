import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers/AppProviders';
import { routes } from '@/app/router/routes';
import { createMockRepositories } from '@/services/mock';
import type { Repositories } from '@/services/repositories';

/** Renders the real route tree at `path` with in-memory repositories and a fresh query client. */
/** Seed account used by tests: an admin (`user-can-ozturk`) unless a test passes another. */
export const TEST_ADMIN = 'user-can-ozturk';
export const TEST_VIEWER = 'user-elif-kaya';

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
