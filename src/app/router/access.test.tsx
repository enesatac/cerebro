import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('role-based access', () => {
  it('shows create and edit actions to admins', async () => {
    renderRoute('/applications/app-payment-gateway');
    expect(await screen.findByRole('link', { name: /^edit$/i })).toHaveAttribute(
      'href',
      '/applications/app-payment-gateway/edit',
    );
  });

  it('hides every change action from read-only users', async () => {
    renderRoute('/applications', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await screen.findByRole('link', { name: 'Payment Gateway' });
    expect(screen.queryByRole('link', { name: /register application/i })).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: /users & roles/i })).not.toBeInTheDocument();
  });

  it('denies form routes to read-only users even via direct URL', async () => {
    renderRoute('/projects/new', createMockRepositories({ signedInAs: TEST_VIEWER }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You do not have access' }),
    ).toBeInTheDocument();
  });

  it('redirects signed-out visitors to sign-in and back after signing in', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/teams', createMockRepositories());
    const button = await screen.findByRole('button', { name: 'Continue as Elif Kaya' });
    expect(router.state.location.pathname).toBe('/sign-in');
    await user.click(button);
    expect(await screen.findByRole('heading', { level: 1, name: 'Teams' })).toBeInTheDocument();
  });
});

describe('create flow', () => {
  it('validates, saves and opens the new record', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/technologies/new');
    await user.click(await screen.findByRole('button', { name: 'Add technology' }));
    expect(await screen.findByText('Fix 1 problem before saving')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Rust');
    await user.click(screen.getByRole('button', { name: 'Add technology' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Rust' })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/technologies/tech-rust'));
  });

  it('renders every edit form without errors', async () => {
    for (const path of [
      '/applications/app-payment-gateway/edit',
      '/projects/prj-digital-onboarding/edit',
      '/teams/team-platform/edit',
      '/risks/risk-dot-vendor/edit',
      '/escalations/esc-dot-vendor/edit',
      '/decisions/dec-lbc-retire/edit',
      '/architecture/dependencies/dep-oms-pay/edit',
      '/architecture/integrations/int-oms-pay-auth/edit',
      '/admin/users/user-elif-kaya/edit',
    ]) {
      const { unmount } = renderRoute(path);
      expect(
        await screen.findByRole('button', { name: 'Save changes' }, { timeout: 3000 }),
      ).toBeInTheDocument();
      unmount();
    }
  });
});
